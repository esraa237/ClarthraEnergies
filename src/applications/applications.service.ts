import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { ApplicationDataDto } from './dto/application.dto';
import { FileType } from 'src/files/contstants/file.constant';
import { FilesService } from 'src/files/file.service';
import { Application } from './entities/application.entity';
import { Position } from 'src/positions/entities/position.entity';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name)
    private readonly applicationModel: Model<Application>,
    private readonly filesService: FilesService,
    @InjectModel(Position.name)
    private readonly positionModel: Model<Position>,
  ) { }

  async create(body: ApplicationDataDto, files: Record<string, Express.Multer.File[]>) {
    let positionId: null | string = null;
    if (body.positionId) {
      if (!isValidObjectId(body.positionId)) {
        throw new BadRequestException(I18nContext.current()!.t('errors.APPLICATIONS.INVALID_POSITION_ID'));
      }

      const positionExists = await this.positionModel.exists({ _id: body.positionId });
      if (!positionExists) {
        throw new BadRequestException(I18nContext.current()!.t('errors.APPLICATIONS.POSITION_NOT_FOUND'));
      }

      positionId = body.positionId;
    }
    const fileMap: Record<string, Express.Multer.File> = {};
    for (const key in files) {
      if (files[key] && files[key][0]) {
        fileMap[key] = files[key][0];
      }
    }

    const host = process.env.HOST_URL || 'http://localhost:3000';
    const savedFiles =
      Object.keys(fileMap).length > 0
        ? await this.filesService.saveFilesWithKeys(fileMap, 'applications', host, FileType.FILE)
        : {};

    const created = await this.applicationModel.create({
      ...body,
      positionId,
      files: {
        cv: savedFiles.cv || null,
        coverLetter: savedFiles.coverLetter || null,
        employeeReference: savedFiles.employeeReference || null,
        certificate: savedFiles.certificate || null,
        other: savedFiles.other || null,
      },
    });

    return {
      message: I18nContext.current()!.t('events.APPLICATIONS.SUBMIT_SUCCESS'),
      application: created,
    };
  }


  async getAll(page = 1, limit = 10, status?: 'pending' | 'approved' | 'rejected' | 'contacted', positionId?: string): Promise<{
    totalItems: number;
    totalPages: number;
    currentPage: number;
    data: any[];
  }> {
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (status) filter.status = status;
    if (positionId === 'none') {
      filter.positionId = { $exists: false };
    } else if (positionId) {
      filter.positionId = positionId;
    }

    const total = await this.applicationModel.countDocuments(filter);
    const applications = await this.applicationModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate({
        path: 'positionId',
        select: 'name location type',
        options: { retainNullValues: true },
      })
      .lean();

    const data = applications.map(({ positionId, ...rest }) => ({
      ...rest,
      position: positionId || null,
    }));

    return {
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: data,
    };
  }

  async getById(id: string) {
    const application = await this.applicationModel.findOne({
      _id: id,
    })
      .populate({
        path: 'positionId',
        select: 'name location type',
        options: { retainNullValues: true },
      }).lean();

    if (!application) throw new BadRequestException(I18nContext.current()!.t('errors.APPLICATIONS.NOT_FOUND_ID', { args: { id } }));
    const data = {
      ...application,
      position: application.positionId || null,
    };

    delete data.positionId;
    return data;
  }

  async deleteById(id: string) {
    const application = await this.applicationModel.findById(id);
    if (!application) {
      throw new BadRequestException(I18nContext.current()!.t('errors.APPLICATIONS.NOT_FOUND_ID', { args: { id } }));
    }

    if (application.files) {
      const fileUrls = Object.values(application.files).filter(Boolean) as string[];
      for (const url of fileUrls) {
        await this.filesService.deleteFileByUrl(url);
      }
    }

    await this.applicationModel.deleteOne({ _id: id });

    return { message: I18nContext.current()!.t('events.APPLICATIONS.DELETE_SUCCESS', { args: { id } }) };
  }

  async updateStatus(id: string, status: 'pending' | 'approved' | 'rejected' | 'contacted') {
    const application = await this.applicationModel.findById(id);
    if (!application) throw new BadRequestException(I18nContext.current()!.t('errors.APPLICATIONS.NOT_FOUND'));

    application.status = status;
    await application.save();

    return { message: I18nContext.current()!.t('events.APPLICATIONS.UPDATE_STATUS', { args: { status } }), application };
  }

  async getApplicationsStatistics(year?: number, month?: number): Promise<any> {
    try {
      const totalApplications = await this.applicationModel.countDocuments();

      const monthlyStats = await this.applicationModel.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      const monthlyDistribution = monthlyStats.map((item) => ({
        year: item._id.year,
        month: monthNames[item._id.month - 1],
        count: item.count,
      }));

      let filteredMonth: any = null;
      if (year && month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);

        const count = await this.applicationModel.countDocuments({
          createdAt: { $gte: startDate, $lt: endDate },
        });

        filteredMonth = {
          year,
          month: monthNames[month - 1],
          count,
        };
      }

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const thisMonthCount = await this.applicationModel.countDocuments({
        createdAt: { $gte: thisMonthStart, $lt: thisMonthEnd },
      });

      const byPosition = await this.applicationModel.aggregate([
        {
          $lookup: {
            from: 'positions',
            localField: 'positionId',
            foreignField: '_id',
            as: 'position',
          },
        },
        { $unwind: { path: '$position', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$position.name',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      const positionDistribution = byPosition.map((p) => ({
        position: p._id || 'No position',
        count: p.count,
      }));

      return {
        summary: {
          totalApplications,
          thisMonthCount,
        },
        monthlyDistribution,
        filteredMonth,
        byPosition: positionDistribution,
      };
    } catch (error) {
      throw new InternalServerErrorException(I18nContext.current()!.t('errors.APPLICATIONS.STATS_ERROR'));
    }
  }
}
