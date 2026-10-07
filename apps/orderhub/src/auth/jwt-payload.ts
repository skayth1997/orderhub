import { UserRole } from '../users/user.entity.js';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
}
