import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../common/role.enum';


interface AuthenticatedRequest {
  user: User;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    //If no roles are specified, anyone can access.
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    //If the user has one of the required roles, access is granted. Otherwise, denied.
    return requiredRoles.some((role) => user.role === role);
  }
}
