import { UserRole } from './user-role.js';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
}
