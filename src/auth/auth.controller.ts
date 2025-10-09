import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/auth.dto';
import { AuthMessages } from './constants/auth-messages';
import { UsersService } from '../users/users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @ApiOperation({ summary: 'Login and receive JWT token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged in successfully',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: `Invalid credentials or incomplete profile.
     Possible messages: 
      - ${AuthMessages.INVALID_CREDENTIALS}
      - ${AuthMessages.COMPLETE_YOUR_PROFILE}`,
  })
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async login(@Body() loginDto: LoginDto) {
    const token = await this.authService.login(loginDto);
    return {
      message: AuthMessages.USER_LOGGED_IN,
      token,
    };
  }
}
