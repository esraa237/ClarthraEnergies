import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { UserMessages } from './constants/user.constants';
import { AddAdminDto, CompleteProfileDto, CreateUserDto, UpdateProfileDto } from './dto/user.dto';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/role.enum';
import { generateEmailTemplate } from '../mail/email-template';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly mailService: MailService
  ) { }

  // ------------------ ADMIN & PROFILE ------------------ //

  async addAdmin(body: AddAdminDto) {
    await this.ensureEmailNotDuplicate(body.email, true);

    const { token, expiresAt } = this.generateTokenWithExpiry(Number(process.env.PROFILE_COMPLETION_TOKEN_EXPIRY));

    const admin = await this.createUser({
      email: body.email,
      role: Role.ADMIN,
      isProfileCompleted: false,
      profileCompletionToken: token,
      profileCompletionTokenExpiresAt: expiresAt,
    });

    const setupUrl = this.buildUrl('/setup', token);
    await this.sendEmail(admin.email, 'Account Setup Invitation', `Hello ${admin.fullName || admin.userName || 'User'},`, setupUrl, 'Complete Account Setup');

    return {
      message: UserMessages.ADMIN_CREATED,
      user: { id: admin._id, email: admin.email },
    };
  }

  // users.service.ts
  async getAllAdmins(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const admins = await this.userModel
      .find({ role: Role.ADMIN })
      .select('_id email fullName userName isProfileCompleted createdAt')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await this.userModel.countDocuments({ role: Role.ADMIN });

    return {
      data: admins,
      meta: {
        totalAdmins: total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async resendProfileCompletionEmail(email: string) {
    const user = await this.findByEmail(email);
    if (user.isProfileCompleted) throw new BadRequestException(UserMessages.PROFILE_COMPLETED);

    const { token, expiresAt } = this.generateTokenWithExpiry(Number(process.env.PROFILE_COMPLETION_TOKEN_EXPIRY));
    user.profileCompletionToken = token;
    user.profileCompletionTokenExpiresAt = expiresAt;
    await user.save();

    const setupUrl = this.buildUrl('/setup', token, true);
    await this.sendEmail(user.email, 'Account Setup Invitation', `Hello ${user.fullName || user.userName || 'User'},`, setupUrl, 'Complete Account Setup');

    return { message: UserMessages.PROFILE_COMPLETE_EMAIL_SENT, user: { id: user._id, email: user.email } };
  }

  async completeProfile(token: string, updateData: CompleteProfileDto) {
    const user = await this.userModel.findOne({ profileCompletionToken: token });
    if (!user) throw new BadRequestException(UserMessages.THE_LINK_EXPIRED_OR_PROFILE_COMPLETED);
    if (!user.profileCompletionTokenExpiresAt || user.profileCompletionTokenExpiresAt < new Date()) throw new BadRequestException(UserMessages.TOKEN_EXPIRED);

    user.fullName = updateData.fullName;
    user.userName = updateData.userName;
    user.password = await bcrypt.hash(updateData.password, Number(process.env.SALT_NUMBER) || 10);
    user.isProfileCompleted = true;
    user.profileCompletionToken = undefined;
    user.profileCompletionTokenExpiresAt = undefined;

    await user.save();
    return { message: UserMessages.PROFILE_COMPLETED, user: { id: user._id, email: user.email } };
  }

  async updateProfile(userId: string, updateData: UpdateProfileDto) {
    const user = await this.findById(userId);

    if (updateData.fullName) user.fullName = updateData.fullName;
    if (updateData.userName) user.userName = updateData.userName;
    if (updateData.password) user.password = await bcrypt.hash(updateData.password, Number(process.env.SALT_NUMBER) || 10);

    if (updateData.email && updateData.email !== user.email) {
      await this.ensureEmailNotDuplicate(updateData.email);
      const { token, expiresAt } = this.generateTokenWithExpiry(Number(process.env.EMAIL_UPDATE_TOKEN_EXPIRY));
      user.newEmailPending = updateData.email;
      user.emailUpdateToken = token;
      user.emailUpdateTokenExpiresAt = expiresAt;

      const verifyUrl = this.buildUrl('/verify-email', token, true);
      await this.sendEmail(updateData.email, 'Verify Your New Email', `Hello ${user.fullName || user.userName || 'User'},`, verifyUrl, 'Verify Email');
    }

    await user.save();
    return { message: UserMessages.DATA_UPDATED, user: { id: user._id, email: user.email } };
  }

  async removeAdmin(adminId: string) {
    const admin = await this.findById(adminId);

    if (admin.role !== Role.ADMIN)
      throw new BadRequestException(UserMessages.NOT_AN_ADMIN);

    await this.userModel.deleteOne({ _id: adminId });

    return { message: UserMessages.ADMIN_REMOVED_SUCCESSFULLY, userId: adminId };
  }


  async verifyNewEmail(token: string) {
    const user = await this.userModel.findOne({ emailUpdateToken: token });
    if (!user) throw new BadRequestException(UserMessages.INVALID_TOKEN);
    if (!user.emailUpdateTokenExpiresAt || user.emailUpdateTokenExpiresAt < new Date()) throw new BadRequestException(UserMessages.TOKEN_EXPIRED);
    if (!user.newEmailPending) throw new BadRequestException(UserMessages.THE_LINK_EXPIRED_OR_PROFILE_COMPLETED);

    user.email = user.newEmailPending;
    user.newEmailPending = undefined;
    user.emailUpdateToken = undefined;
    user.emailUpdateTokenExpiresAt = undefined;
    await user.save();

    return { message: UserMessages.EMAIL_VERIFIED_SUCCESSFULLY, user: { id: user._id, email: user.email } };
  }

  // ------------------ FORGET & RESET PASSWORD ------------------ //

  async forgetPassword(email: string) {
    const user = await this.findByEmail(email);

    const { token, expiresAt } = this.generateTokenWithExpiry(parseInt(process.env.RESET_PASSWORD_TOKEN_EXPIRY || '3600000', 10)); // default 1 hour
    user.resetPasswordToken = token;
    user.resetPasswordTokenExpiresAt = expiresAt;

    await user.save();

    const resetUrl = this.buildUrl('/reset-password', token);
    await this.sendEmail(user.email, 'Reset Your Password', `Hello ${user.fullName || user.userName || 'User'},`, resetUrl, 'Reset Password');

    return { message: UserMessages.RESET_EMAIL_SENT };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userModel.findOne({ resetPasswordToken: token });
    if (!user) throw new BadRequestException(UserMessages.INVALID_TOKEN);
    if (!user.resetPasswordTokenExpiresAt || user.resetPasswordTokenExpiresAt < new Date()) throw new BadRequestException('Token expired');

    user.password = await bcrypt.hash(newPassword, Number(process.env.SALT_NUMBER) || 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiresAt = undefined;

    await user.save();

    return { message: UserMessages.PASSWORD_RESET_SUCCESSFULLY };
  }

  // ------------------ FINDERS ------------------ //

  async findByEmail(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException(UserMessages.USER_NOT_FOUND);
    return user;
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException(UserMessages.USER_NOT_FOUND);
    return user;
  }

  async isEmailDuplicated(email: string): Promise<boolean> {
    return !!(await this.userModel.findOne({ email }));
  }

  async createUser(createUserDto: CreateUserDto) {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  // ------------------ EMAIL HELPERS ------------------ //

  private async sendEmail(to: string, subject: string, greeting: string, ctaUrl: string, ctaText: string) {
    const emailContent = generateEmailTemplate({
      title: `${process.env.COMPANY_NAME} - ${subject}`,
      greeting,
      message: `Please click the button below to proceed.`,
      ctaText,
      ctaUrl,
      warning: 'This link is valid for 24 hours only. If you did not request this, please ignore this email.',
      companyName: process.env.COMPANY_NAME || '',
      logoUrl: process.env.COMPANY_LOGO_URL || '',
      supportEmail: process.env.COMPANY_SUPPORT_EMAIL || '',
    });

    await this.mailService.sendEmail({ to, subject: `${process.env.COMPANY_NAME} - ${subject}`, html: emailContent.html, text: emailContent.plainText });
  }

  private generateTokenWithExpiry(expiryMs: number = 24 * 60 * 60 * 1000) {
    return { token: randomBytes(32).toString('hex'), expiresAt: new Date(Date.now() + expiryMs) };
  }

  private buildUrl(path: string, token: string, isFrontAdmin: boolean = false) {
    const base = isFrontAdmin ? process.env.FRONT_ADMIN_URL : process.env.FRONTEND_URL;
    return `${base}${path}?token=${token}`;
  }

  private async ensureEmailNotDuplicate(email: string, isProfileEmail: boolean = false) {
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) throw new ConflictException(isProfileEmail ? UserMessages.EMAIL_ALREADY_EXISTS_OR_COMPLETE_EMAIL_DONT_SEND : UserMessages.EMAIL_ALREADY_EXISTS);
  }
}
