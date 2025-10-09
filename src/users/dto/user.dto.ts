import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength, Matches, IsNotEmpty } from 'class-validator';
import { Role } from '../../common/role.enum';
import { User } from '../entities/user.entity';

export class CreateUserDto {
    @ApiProperty({
        example: 'test@example.com',
        description: 'User email address. Must be a valid email format.'
    })
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;

    @ApiProperty({
        example: 'test',
        description: 'Optional username. Must be a string.'
    })
    @IsOptional()
    @IsString({ message: 'Username must be a string' })
    userName?: string;

    @ApiProperty({
        example: 'Test User',
        description: 'Optional full name of the user. Must be a string.'
    })
    @IsOptional()
    @IsString({ message: 'Full name must be a string' })
    fullName?: string;

    @ApiProperty({
        example: 'Abc12345',
        description: 'Optional password. Minimum 6 characters, at least one letter and one number.'
    })
    @IsOptional()
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]+$/, {
        message: 'Password must contain at least one letter and one number',
    })
    password?: string;

    @ApiProperty({
        enum: Role,
        default: Role.ADMIN,
        description: 'User role. Can be ADMIN or SUPERADMIN.'
    })
    @IsOptional()
    @IsEnum(Role, { message: 'Role must be either ADMIN or SUPERADMIN' })
    role?: Role;

    @ApiProperty({
        default: false,
        description: 'Indicates whether the user has completed their profile.'
    })
    @IsOptional()
    isProfileCompleted?: boolean;

    @IsOptional()
    profileCompletionToken?: string;

    @IsOptional()
    profileCompletionTokenExpiresAt?: Date;
}

export class CompleteProfileDto {
    @ApiProperty({
        example: 'test',
        description: 'Username to set for the user. Must be a string.'
    })
    @IsString({ message: 'Username must be a string' })
    @IsNotEmpty()
    userName: string;

    @ApiProperty({
        example: 'Test User',
        description: 'Full name of the user. Must be a string.'
    })
    @IsString({ message: 'Full name must be a string' })
    @IsNotEmpty()
    fullName: string;

    @ApiProperty({
        example: 'Abc12345',
        description: 'Password for the user. Minimum 6 characters, must include at least one letter and one number.'
    })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]+$/, {
        message: 'Password must contain at least one letter and one number',
    })
    @IsNotEmpty()
    password: string;
}

export class AddAdminDto {
    @ApiProperty({
        example: 'admin@example.com',
        description: 'Email of the admin to add. Must be valid and not empty.'
    })
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;
}

export class UserIdEmailDto {
    @ApiProperty({ example: '64f1c2b7a1f4c2e5d6b12345', description: 'User ID' })
    id: string;

    @ApiProperty({ example: 'admin@example.com', description: 'User email' })
    email: string;
}

export class AddAdminResponseDto {
    @ApiProperty({ example: 'Admin created successfully', description: 'Operation message' })
    message: string;

    @ApiProperty({ type: UserIdEmailDto })
    user: UserIdEmailDto;
}

export class CompleteProfileResponseDto {
    @ApiProperty({ example: 'Profile completed successfully', description: 'Operation message' })
    message: string;

    @ApiProperty({ type: UserIdEmailDto })
    user: UserIdEmailDto;
}
export class UpdateProfileDto {
    @ApiProperty({
        example: 'Test User',
        description: 'fullname for the user.'
    })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiProperty({
        example: 'user',
        description: 'Username.'
    })
    @IsOptional()
    @IsString()
    userName?: string;

    @ApiProperty({
        example: 'admin@example.com',
        description: 'Email of the admin to add. Must be valid and not empty.'
    })
    @IsOptional()
    @IsEmail({}, { message: 'Invalid email format' })
    email?: string;

    @ApiProperty({
        example: 'Abc12345',
        description: 'Password for the user. Minimum 6 characters, must include at least one letter and one number.'
    })
    @IsOptional()
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]+$/, {
        message: 'Password must contain at least one letter and one number',
    })
    password?: string;
}

export class UpdateProfileResponseDto {
    @ApiProperty({ example: 'Data updated successfully, if email is changed, please verify your new email address.', description: 'Operation message' })
    message: string;

    @ApiProperty({ type: UserIdEmailDto })
    user: UserIdEmailDto;
}

export class VerifyEmailResponseDto{
    @ApiProperty({ example: 'Email verified successfully', description: 'Operation message' })
    message: string;

    @ApiProperty({ type: UserIdEmailDto })
    user: UserIdEmailDto;
}