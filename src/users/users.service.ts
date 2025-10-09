import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { UserMessages } from './constants/user.constants';
import { AddAdminDto, CompleteProfileDto, CreateUserDto } from './dto/user.dto';
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

  async addAdmin(body: AddAdminDto) {
    const isDuplicate = await this.isEmailDuplicated(body.email);
    if (isDuplicate) throw new ConflictException(UserMessages.EMAIL_ALREADY_EXISTS_BUT_DONT_COMPLETE);

    const token = randomBytes(32).toString('hex');
    const tokenExpiryMs = Number(process.env.PROFILE_COMPLETION_TOKEN_EXPIRY) || 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + tokenExpiryMs);

    const admin = await this.createUser({
      email: body.email,
      role: Role.ADMIN,
      isProfileCompleted: false,
      profileCompletionToken: token,
      profileCompletionTokenExpiresAt: expiresAt,
    });

    const setupUrl = `${process.env.FRONTEND_URL}/setup?token=${token}`;
    await this.sendAdminProfileSetupEmail(admin, setupUrl);

    return {
      message: UserMessages.ADMIN_CREATED,
      user: {
        id: admin._id,
        email: admin.email
      }
    };
  }

  async resendProfileCompletionEmail(email: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) throw new NotFoundException(UserMessages.USER_NOT_FOUND);
    if (user.isProfileCompleted) throw new BadRequestException(UserMessages.PROFILE_COMPLETED);

    const token = randomBytes(32).toString('hex');
    const tokenExpiryMs = Number(process.env.PROFILE_COMPLETION_TOKEN_EXPIRY) || 24 * 60 * 60 * 1000;
    user.profileCompletionToken = token;
    user.profileCompletionTokenExpiresAt = new Date(Date.now() + tokenExpiryMs);

    await user.save();

    const setupUrl = `${process.env.FRONT_ADMIN_URL}/setup?token=${token}`;
    await this.sendAdminProfileSetupEmail(user, setupUrl);

    return {
      message: UserMessages.PROFILE_COMPLETE_EMAIL_SENT,
      user: {
        id: user._id,
        email: user.email
      }
    };
  }

  async completeProfile(token: string, updateData: CompleteProfileDto) {
    const user = await this.userModel.findOne({ profileCompletionToken: token });

    if (!user) throw new BadRequestException(UserMessages.THE_LINK_EXPIRED_OR_PROFILE_COMPLETED);
    if (!user.profileCompletionTokenExpiresAt || user.profileCompletionTokenExpiresAt < new Date())
      throw new BadRequestException(UserMessages.TOKEN_EXPIRED);

    user.fullName = updateData.fullName;
    user.userName = updateData.userName;
    user.password = await bcrypt.hash(updateData.password, Number(process.env.SALT_NUMBER) || 10);
    user.isProfileCompleted = true;

    user.profileCompletionToken = undefined;
    user.profileCompletionTokenExpiresAt = undefined;

    return {
      message: UserMessages.PROFILE_COMPLETED,
      user: {
        id: (await user.save())._id,
        email: user.email
      }
    }
  }

  async findByEmail(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException(UserMessages.USER_NOT_FOUND);
    }
    return user;
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(UserMessages.USER_NOT_FOUND);
    }
    return user;
  }

  async isEmailDuplicated(email: string): Promise<boolean> {
    const existingUser = await this.userModel.findOne({ email });
    return !!existingUser;
  }

  async createUser(createUserDto: CreateUserDto) {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async sendAdminProfileSetupEmail(user: User, setupUrl: string) {
    const emailContent = generateEmailTemplate({
      title: `${process.env.COMPANY_NAME} - Account Setup Invitation`,
      greeting: `Hello ${user.fullName || user.userName || "User"},`,
      message: `A new account setup link has been generated for your ${process.env.COMPANY_NAME} account. Please click the button below to complete your account setup and set your password.`,
      ctaText: "Complete Account Setup",
      ctaUrl: setupUrl,
      warning: "This link is valid for 24 hours only. If you did not request this, please ignore this email.",
      companyName: process.env.COMPANY_NAME || '',
      logoUrl: process.env.COMPANY_LOGO_URL || '',
      supportEmail: process.env.COMPANY_SUPPORT_EMAIL || '',
    });

    await this.mailService.sendEmail({
      to: user.email,
      subject: `${process.env.COMPANY_NAME} - Account Setup Invitation`,
      html: emailContent.html,
      text: emailContent.plainText,
    });
  }

}
