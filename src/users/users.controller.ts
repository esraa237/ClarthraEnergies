import { Controller, Post, Patch, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { AddAdminDto, AddAdminResponseDto, CompleteProfileDto, CompleteProfileResponseDto, UpdateProfileDto, UpdateProfileResponseDto, VerifyEmailResponseDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/common/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Types } from 'mongoose';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('add-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add a new admin user (SuperAdmin only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Admin created successfully', type: AddAdminResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already exists (OR) The complete profile email didn’t send. If that’s the case, please resend it manually.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid email input' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized - jwt token wrong or you arenot super admin' })
  async addAdmin(@Body() body: AddAdminDto) {
    return await this.usersService.addAdmin(body);
  }

  @Post('resend-complete-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Resend profile completion email (SuperAdmin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email resent successfully', type: AddAdminDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Profile already completed' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized - jwt token wrong or you arenot super admin' })
  async resendCompleteProfile(@Body() body: AddAdminDto) {
    return this.usersService.resendProfileCompletionEmail(body.email);
  }

  @Patch('complete-profile/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete user profile using token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile completed successfully', type: CompleteProfileResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'This link is no longer valid or profile is already completed.' })
  async completeProfile(
    @Param('token') token: string,
    @Body() updateData: CompleteProfileDto
  ) {
    return await this.usersService.completeProfile(token, updateData);
  }

  @Patch('update-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update user profile (admin can update his data only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile updated successfully', type: UpdateProfileResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already in use' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized - JWT token invalid' })
  async updateProfile(
    @CurrentUser() user: User & { _id: Types.ObjectId },
    @Body() updateData: UpdateProfileDto
  ) {
    return this.usersService.updateProfile((user._id).toString(), updateData);
  }

  @Patch('verify-email/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify new email using token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email verified successfully', type: VerifyEmailResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Token expired or no new email to verify' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Invalid token' })
  async verifyEmail(@Param('token') token: string) {
    return this.usersService.verifyNewEmail(token);
  }

}
