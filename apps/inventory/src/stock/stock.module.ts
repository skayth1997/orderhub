import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { KAFKA_CLIENT } from '../events/events.js';
import { OrderEventsController } from './order-events.controller.js';
import { Stock } from './stock.entity.js';
import { StockController } from './stock.controller.js';
import { StockService } from './stock.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stock]),
    AuthModule,
    // The Kafka producer we use to publish stock events.
    ClientsModule.registerAsync([
      {
        name: KAFKA_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            // We only SEND messages here. Without this, the client also joins a
            // consumer group, which slows down start and shutdown.
            producerOnlyMode: true,
            client: {
              clientId: 'inventory-producer',
              brokers: config.get('KAFKA_BROKERS', 'localhost:9092').split(','),
            },
          },
        }),
      },
    ]),
  ],
  controllers: [StockController, OrderEventsController],
  providers: [StockService],
})
export class StockModule {}
