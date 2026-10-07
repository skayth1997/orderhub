import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { KAFKA_CLIENT } from './events/order-created.event.js';
import { Order } from './order.entity.js';
import { OrdersController } from './orders.controller.js';
import { StockEventsController } from './stock-events.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
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
              clientId: 'orderhub',
              brokers: config.get('KAFKA_BROKERS', 'localhost:9092').split(','),
            },
          },
        }),
      },
    ]),
  ],
  controllers: [OrdersController, StockEventsController],
  providers: [OrdersService],
})
export class OrdersModule {}
