import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getRequest } from './auth.guard.js';
import { ROLES_KEY } from './roles.decorator.js';
import { UserRole } from '../users/user.entity.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!allowedRoles) {
      return true;
    }

    const request = getRequest(context);
    if (!allowedRoles.includes(request.user.role)) {
      throw new ForbiddenException('You do not have permission');
    }
    return true;
  }
}
