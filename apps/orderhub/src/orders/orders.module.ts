import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { RateLimitModule } from '../rate-limit/rate-limit.module.js';
import { KAFKA_CLIENT } from './events/order-created.event.js';
import { Order } from './order.entity.js';
import { OutboxEvent } from './outbox/outbox-event.entity.js';
import { OutboxPublisher } from './outbox/outbox.publisher.js';
import { OrdersController } from './orders.controller.js';
import { StockEventsController } from './stock-events.controller.js';
import { OrdersResolver } from './orders.resolver.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OutboxEvent]),
    AuthModule,
    RateLimitModule,

    ClientsModule.registerAsync([
      {
        name: KAFKA_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            producerOnlyMode: true,
            client: {
              clientId: 'orderhub',
              brokers: config.get('KAFKA_BROKERS', 'localhost:9092').split(','),
            },
          },
        }),
      },
    ]),
  ],
  controllers: [OrdersController, StockEventsController],
  providers: [OrdersService, OrdersResolver, OutboxPublisher],
})
export class OrdersModule {}
