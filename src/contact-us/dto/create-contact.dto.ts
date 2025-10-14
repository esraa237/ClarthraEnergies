import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateContactDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiProperty({ required: true })
    @IsString()
    @IsOptional()
    organization: string;

    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    areaOfInterest: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    representation: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    message: string;
}

export class PaginationQueryDto {
    @ApiProperty({
        description: 'Page number (must be ≥ 1)',
        required: false,
        example: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiProperty({
        description: 'Number of items per page (must be ≥ 1)',
        required: false,
        example: 10,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}