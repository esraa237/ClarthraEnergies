import { Controller, Post, Patch, Body, Param, UseGuards, HttpCode, HttpStatus, Query, Get, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { AddAdminDto, AddAdminResponseDto, CompleteProfileDto, CompleteProfileResponseDto, ForgetPasswordDto, ResetPasswordDto, UpdateProfileDto, UpdateProfileResponseDto, VerifyEmailResponseDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/common/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
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

  // users.controller.ts
  @Get('admins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number, default is 1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page, default is 10' })
  @ApiOperation({ summary: 'Get all admin users with pagination (SuperAdmin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of admin users' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized - jwt token invalid and superAdmin only' })
  async getAdmins(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.usersService.getAllAdmins(Number(page), Number(limit));
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

  @Get('user-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user profile data (admin can get his data only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized - JWT token invalid' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async getMyData(@CurrentUser() user: User & { _id: Types.ObjectId }) {
    return this.usersService.getMyData(user._id.toString());
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

  @Delete('remove-admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove an admin user (SuperAdmin only)' })
  @ApiParam({ name: 'id', description: 'Admin ID to remove' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Admin removed successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Admin not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'The selected user is not an admin' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized - SuperAdmin only' })
  async removeAdmin(@Param('id') id: string) {
    return this.usersService.removeAdmin(id);
  }

  @Patch('verify-email/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify new email using token - when updating email will send email and need this endpoint to verify the updated email' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email verified successfully', type: VerifyEmailResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Token expired or no new email to verify' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Invalid token' })
  async verifyEmail(@Param('token') token: string) {
    return this.usersService.verifyNewEmail(token);
  }

  @Post('forget-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request reset password email' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email sent successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async forgetPassword(@Body() body: ForgetPasswordDto) {
    return this.usersService.forgetPassword(body.email);
  }

  @Post('reset-password/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Token expired' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Invalid token or that email isnt last one' })
  async resetPassword(@Param('token') token: string, @Body() body: ResetPasswordDto) {
    return this.usersService.resetPassword(token, body.password);
  }

}
