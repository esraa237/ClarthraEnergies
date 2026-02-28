// positions.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { isValidObjectId, Model } from 'mongoose';
import { Position } from './entities/position.entity';
import { CreatePositionDto, PaginationDto } from './dto/position.dto';
import { Application } from 'src/applications/entities/application.entity';
import { I18nContext } from 'nestjs-i18n';
import { sanitizeHtmlField } from '../utils/sanitize.util';

@Injectable()
export class PositionsService {
  constructor(
    @InjectModel(Position.name) private positionModel: Model<Position>,
     @InjectModel(Application.name) private applicationModel: Model<Application>,
  ) { }

  async create(data: CreatePositionDto): Promise<Position> {
    try {
      const sanitizedData = {
        ...data,
        whatWeOffer: sanitizeHtmlField(data.whatWeOffer),
        whyWeAreLooking: sanitizeHtmlField(data.whyWeAreLooking),
        responsibilities: sanitizeHtmlField(data.responsibilities),
        skills: sanitizeHtmlField(data.skills),
      };
      return await this.positionModel.create(sanitizedData);
    } catch (error) {
      throw new InternalServerErrorException(I18nContext.current()!.t('errors.POSITIONS.CREATE_ERROR'));
    }
  }

  async findAll(pagination: PaginationDto) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.positionModel.aggregate([
          {
            $lookup: {
              from: 'applications',
              localField: '_id',
              foreignField: 'positionId',
              as: 'applications',
            },
          },
          {
            $addFields: {
              applicationsCount: { $size: '$applications' },
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              name: 1,
              location: 1,
              type: 1,
              whatWeOffer: 1,
              whyWeAreLooking: 1,
              responsibilities: 1,
              skills: 1,
              createdAt: 1,
              updatedAt: 1,
              applicationsCount: 1,
              applications: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                status: 1,
                createdAt: 1,
              },
            },
          },
        ]),
        this.positionModel.countDocuments(),
      ]);

      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data,
      };
    } catch (error) {
      throw new InternalServerErrorException(I18nContext.current()!.t('errors.POSITIONS.RETRIEVE_ERROR'));
    }
  }

  async findOne(id: string): Promise<any> {
    this.validateId(id);
    try {
      const result = await this.positionModel.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(id) },
        },
        {
          $lookup: {
            from: 'applications',
            localField: '_id',
            foreignField: 'positionId',
            as: 'applications',
          },
        },
        {
          $addFields: {
            applicationsCount: { $size: '$applications' },
          },
        },
        {
          $project: {
            name: 1,
            location: 1,
            type: 1,
            whatWeOffer: 1,
            whyWeAreLooking: 1,
            responsibilities: 1,
            skills: 1,
            createdAt: 1,
            updatedAt: 1,
            applicationsCount: 1,
            applications: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              email: 1,
              status: 1,
              createdAt: 1,
            },
          },
        },
      ]);

      const position = result[0];
      if (!position) throw new NotFoundException(I18nContext.current()!.t('errors.POSITIONS.NOT_FOUND'));
      return position;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(I18nContext.current()!.t('errors.POSITIONS.RETRIEVE_ONE_ERROR'));
    }
  }


  async update(id: string, data: Partial<CreatePositionDto>): Promise<Position> {
    this.validateId(id);
    try {
      // Backend now receives full localized objects (e.g. { en: "...", fr: "..." })
      // So we can pass data directly.
      const sanitizedData = {
        ...data,
      };
      
      if (sanitizedData.whatWeOffer) sanitizedData.whatWeOffer = sanitizeHtmlField(sanitizedData.whatWeOffer);
      if (sanitizedData.whyWeAreLooking) sanitizedData.whyWeAreLooking = sanitizeHtmlField(sanitizedData.whyWeAreLooking);
      if (sanitizedData.responsibilities) sanitizedData.responsibilities = sanitizeHtmlField(sanitizedData.responsibilities);
      if (sanitizedData.skills) sanitizedData.skills = sanitizeHtmlField(sanitizedData.skills);
      
      const position = await this.positionModel.findByIdAndUpdate(id, sanitizedData, {
        new: true,
      });
      if (!position) throw new NotFoundException(I18nContext.current()?.t('errors.POSITIONS.NOT_FOUND') || 'Position not found');
      return position;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error updating position:', error);
      const i18n = I18nContext.current();
      throw new InternalServerErrorException(i18n ? i18n.t('errors.POSITIONS.UPDATE_ERROR') : 'Error updating position');
    }
  }

  async delete(id: string): Promise<void> {
    this.validateId(id);
    try {
      const position = await this.positionModel.findById(id);
      if (!position) throw new NotFoundException(I18nContext.current()!.t('errors.POSITIONS.NOT_FOUND'));

      await this.applicationModel.deleteMany({ positionId: id });

      await this.positionModel.findByIdAndDelete(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(I18nContext.current()!.t('errors.POSITIONS.DELETE_ERROR'));
    }
  }

  private validateId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(I18nContext.current()?.t('errors.GLOBAL.INVALID_ID') || 'Invalid ID');
    }
  }

  // toLocalizedPayload is no longer needed as frontend sends full object
}
