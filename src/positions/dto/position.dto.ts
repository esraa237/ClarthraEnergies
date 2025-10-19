// dto/create-position.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNotEmpty, IsInt, Min } from 'class-validator';
import { PositionType } from '../positions.constants';
import { Type } from 'class-transformer';
import { Position } from '../entities/position.entity';

export class CreatePositionDto {
  @ApiProperty({ example: 'Frontend Developer' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Cairo, Egypt' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    enum: PositionType,
    enumName: 'PositionType',
    example: PositionType.FULL_TIME,
    description: `Type of employment ['Full-time', 'Part-time', 'Internship', 'Freelance', 'Contract','Temporary']`,
  })
  @IsEnum(PositionType)
  type: string;

  @ApiPropertyOptional({ example: 'Competitive salary and benefits' })
  @IsOptional()
  @IsString()
  whatWeOffer?: string;

  @ApiPropertyOptional({ example: 'We are expanding our tech team' })
  @IsOptional()
  @IsString()
  whyWeAreLooking?: string;

  @ApiPropertyOptional({ example: 'Develop responsive UIs' })
  @IsOptional()
  @IsString()
  responsibilities?: string;

  @ApiPropertyOptional({ example: 'HTML, CSS, React' })
  @IsOptional()
  @IsString()
  skills?: string;
}

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}

export class PositionResponseDto {
  @ApiProperty({ type: () => Position })
  data: Position;

  @ApiProperty({ example: 'Position created successfully.' })
  message: string;
}

export class ApplicationSummaryDto {
  @ApiProperty({ example: '6710a4c3f0b8b5f0a0a12345' })
  _id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'pending', enum: ['pending', 'approved', 'rejected', 'contacted'] })
  status: string;

  @ApiProperty({ example: '2025-10-16T12:00:00.000Z' })
  createdAt: Date;
}

// 🔹 Position Response with applicationsCount + applications
export class PositionWithApplicationsDto extends Position {
  @ApiProperty({ example: 5, description: 'Number of applications related to this position' })
  applicationsCount: number;

  @ApiProperty({
    type: [ApplicationSummaryDto],
    description: 'List of applications related to this position',
  })
  applications: ApplicationSummaryDto[];
}

export class PaginatedPositionsResponseDto {
  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;

  @ApiProperty({ type: [PositionWithApplicationsDto] })
  data: PositionWithApplicationsDto[];
}