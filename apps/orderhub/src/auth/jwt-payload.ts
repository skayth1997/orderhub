import { UserRole } from '../users/user.entity.js';

// What we store inside the JWT (and later put on request.user).
export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
}
