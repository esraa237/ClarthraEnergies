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

@Injectable()
export class PositionsService {
  constructor(
    @InjectModel(Position.name) private positionModel: Model<Position>,
     @InjectModel(Application.name) private applicationModel: Model<Application>,
  ) { }

  async create(data: CreatePositionDto): Promise<Position> {
    try {
      return await this.positionModel.create(data);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create position');
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
      throw new InternalServerErrorException('Failed to retrieve positions');
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
      if (!position) throw new NotFoundException('Position not found');
      return position;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to retrieve position');
    }
  }


  async update(id: string, data: Partial<CreatePositionDto>): Promise<Position> {
    this.validateId(id);
    try {
      const position = await this.positionModel.findByIdAndUpdate(id, data, {
        new: true,
      });
      if (!position) throw new NotFoundException('Position not found');
      return position;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to update position');
    }
  }

  async delete(id: string): Promise<void> {
    this.validateId(id);
    try {
      const position = await this.positionModel.findById(id);
      if (!position) throw new NotFoundException('Position not found');

      await this.applicationModel.deleteMany({ positionId: id });

      await this.positionModel.findByIdAndDelete(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete position');
    }
  }

  private validateId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID format');
    }
  }
}
