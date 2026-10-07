import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../users/user.entity.js';

export const ROLES_KEY = 'roles';

// Usage: @Roles(UserRole.Admin, UserRole.Manager)
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
