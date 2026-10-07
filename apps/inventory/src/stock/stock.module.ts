import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Redis } from 'ioredis';
import { AuthModule } from '../auth/auth.module.js';
import { KAFKA_CLIENT } from '../events/events.js';
import { OrderEventsController } from './order-events.controller.js';
import { ProcessedEvent } from './processed-event.entity.js';
import { REDIS_CLIENT } from './redis.js';
import { Stock } from './stock.entity.js';
import { StockController } from './stock.controller.js';
import { StockService } from './stock.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stock, ProcessedEvent]),
    AuthModule,

    ClientsModule.registerAsync([
      {
        name: KAFKA_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            producerOnlyMode: true,
            client: {
              clientId: 'inventory-producer',
              brokers: config.getOrThrow<string>('KAFKA_BROKERS').split(','),
            },
          },
        }),
      },
    ]),
  ],
  controllers: [StockController, OrderEventsController],
  providers: [
    StockService,
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis({
          host: config.getOrThrow('REDIS_HOST'),
          port: Number(config.getOrThrow('REDIS_PORT')),
        }),
    },
  ],
})
export class StockModule {}
