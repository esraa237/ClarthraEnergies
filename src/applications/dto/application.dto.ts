import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ApplicationDataDto {
  @ApiProperty({ example: 'John', description: 'First name of the applicant' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the applicant' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'john@domain.com', description: 'Applicant email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+20 100 1234567', description: 'Phone number' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({
    example: '2025-10-20',
    description: 'Date when the applicant is available to start',
  })
  @IsOptional()
  @IsDateString()
  availableFrom?: Date;

  @ApiPropertyOptional({ example: 'Cairo', description: 'Location of applicant' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 15000, description: 'Expected salary (optional)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  expectedSalary?: number;

  @ApiPropertyOptional({
    example: '68f29ebf9adc2a84b3d12682',
    description: 'Optional ID of the related position',
  })
  @IsOptional()
  positionId: string;
}

export class CreateApplicationDto extends ApplicationDataDto {
  @ApiProperty({ type: 'string', format: 'binary', required: true })
  cv: string;

  @ApiProperty({ type: 'string', format: 'binary', required: true })
  coverLetter: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', required: false })
  employeeReference?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', required: false })
  certificate?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', required: false })
  other?: string;
}