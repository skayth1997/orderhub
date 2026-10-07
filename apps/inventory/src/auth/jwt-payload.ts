import { UserRole } from './user-role.js';

// What orderhub puts inside the JWT.
export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
}
