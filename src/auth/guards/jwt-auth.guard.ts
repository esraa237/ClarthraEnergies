import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { AuthMessages } from '../constants/auth-messages';
import { User } from '../../users/entities/user.entity';


interface AuthenticatedRequest {
  user: User;
  headers: {
    authorization?: string;
  };
}

interface JwtPayload {
  sub: string;
  role: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(AuthMessages.TOKEN_NOT_FOUND);
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.userService.findById(payload.sub);

      // Attach user to request object
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException(AuthMessages.INVALID_TOKEN);
    }
  }

  private extractTokenFromHeader(
    request: AuthenticatedRequest,
  ): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
