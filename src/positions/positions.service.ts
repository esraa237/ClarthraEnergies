// positions.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Position } from './entities/position.entity';
import { CreatePositionDto, PaginationDto } from './dto/position.dto';

@Injectable()
export class PositionsService {
  constructor(
    @InjectModel(Position.name) private positionModel: Model<Position>,
  ) {}

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
        this.positionModel
          .find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
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

  async findOne(id: string): Promise<Position> {
    this.validateId(id);
    try {
      const position = await this.positionModel.findById(id);
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
      const result = await this.positionModel.findByIdAndDelete(id);
      if (!result) throw new NotFoundException('Position not found');
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
