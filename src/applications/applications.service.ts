import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApplicationDataDto } from './dto/application.dto';
import { FileType } from 'src/files/contstants/file.constant';
import { FilesService } from 'src/files/file.service';
import { Application } from './entities/application.entity';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name)
    private readonly applicationModel: Model<Application>,
    private readonly filesService: FilesService,
  ) { }

  async create(body: ApplicationDataDto, files: Record<string, Express.Multer.File[]>) {
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
      files: {
        cv: savedFiles.cv || null,
        coverLetter: savedFiles.coverLetter || null,
        employeeReference: savedFiles.employeeReference || null,
        certificate: savedFiles.certificate || null,
        other: savedFiles.other || null,
      },
    });

    return {
      message: 'Application submitted successfully',
      application: created,
    };
  }


  async getAll(page = 1, limit = 10, status?: 'pending' | 'approved' | 'rejected' | 'contacted',) {
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (status) filter.status = status;

    const total = await this.applicationModel.countDocuments(filter);
    const applications = await this.applicationModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return {
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: applications,
    };
  }

  async getById(id: string) {
    const application = await this.applicationModel.findOne({
      _id: id,
    });
    if (!application) throw new BadRequestException('No application found for this ');
    return application;
  }

  async deleteById(id: string) {
    const application = await this.applicationModel.findById(id);
    if (!application) {
      throw new BadRequestException(`Application with ID '${id}' not found`);
    }

    if (application.files) {
      const fileUrls = Object.values(application.files).filter(Boolean) as string[];
      for (const url of fileUrls) {
        await this.filesService.deleteFileByUrl(url);
      }
    }

    await this.applicationModel.deleteOne({ _id: id });

    return { message: `Application with ID '${id}' deleted successfully` };
  }

  async updateStatus(id: string, status: 'pending' | 'approved' | 'rejected' | 'contacted') {
    const application = await this.applicationModel.findById(id);
    if (!application) throw new BadRequestException('Application not found');

    application.status = status;
    await application.save();

    return { message: `Application status updated to '${status}'`, application };
  }

}
