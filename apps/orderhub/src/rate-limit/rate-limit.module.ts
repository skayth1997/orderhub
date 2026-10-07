import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.js';
import { TenantRateLimitGuard } from './tenant-rate-limit.guard.js';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis({
          host: config.get('REDIS_HOST', 'localhost'),
          port: Number(config.get('REDIS_PORT', 6379)),
        }),
    },
    TenantRateLimitGuard,
  ],
  exports: [TenantRateLimitGuard, REDIS_CLIENT],
})
export class RateLimitModule implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
