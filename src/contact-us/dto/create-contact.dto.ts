import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

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
    @ApiPropertyOptional({
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

    @ApiPropertyOptional({
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

    @ApiPropertyOptional({
        description:
            'Filter by read status (true = read, false = unread). If omitted, all contacts are returned.',
        example: false,
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    isRead?: boolean;
}

export class UpdateReadStatusDto {
    @ApiProperty({
        description: 'Mark contact as read (true) or unread (false)',
        example: true,
    })
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    isRead: boolean;
}