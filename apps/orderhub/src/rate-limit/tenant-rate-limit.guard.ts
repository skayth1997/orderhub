import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { getRequest } from '../auth/auth.guard.js';
import { REDIS_CLIENT } from './redis.js';

@Injectable()
export class TenantRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(TenantRateLimitGuard.name);

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { tenantId } = getRequest(context).user;
    const limit = Number(this.config.getOrThrow('RATE_LIMIT_PER_MINUTE'));
    const minute = Math.floor(Date.now() / 60000);
    const key = `ratelimit:${tenantId}:${minute}`;

    let count: number;
    try {
      count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.expire(key, 60);
      }
    } catch (error) {
      this.logger.error(
        'Rate limit check failed, letting the request pass',
        error,
      );
      return true;
    }

    if (count > limit) {
      throw new HttpException(
        'Too many requests, try again in a minute',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
