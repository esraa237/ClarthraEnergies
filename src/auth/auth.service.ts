import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/auth.dto';
import { UsersService } from '../users/users.service';
import { AuthMessages } from './constants/auth-messages';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private jwtService: JwtService
  ) { }

  async login(loginDto: LoginDto): Promise<string> {
    let user: User;
    try {
      user = await this.userService.findByEmail(loginDto.email);
    } catch {
      throw new UnauthorizedException(AuthMessages.INVALID_CREDENTIALS);
    }
    if (!user.isProfileCompleted || !user.password) {
      throw new UnauthorizedException(AuthMessages.COMPLETE_YOUR_PROFILE);
    }

    const isPasswordValid = await this.validatePassword(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(AuthMessages.INVALID_CREDENTIALS);
    }
    return await this.generateAuthToken(user.id);
  }

  async generateAuthToken(userId: string): Promise<string> {
    const user = await this.userService.findById(userId);
    return this.generateJwtToken(user);
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  generateJwtToken(user: User): string {
    const payload = {
      sub: user.id,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
