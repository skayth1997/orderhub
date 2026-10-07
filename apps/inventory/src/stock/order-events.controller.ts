import { Controller, Inject, Logger } from '@nestjs/common';
import type { ClientKafka } from '@nestjs/microservices';
import { EventPattern, Payload } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  KAFKA_CLIENT,
  ORDERS_EVENTS_TOPIC,
  STOCK_EVENTS_TOPIC,
} from '../events/events.js';
import type { OrderCreatedEvent } from '../events/events.js';
import { StockService } from './stock.service.js';

@Controller()
export class OrderEventsController {
  private readonly logger = new Logger(OrderEventsController.name);

  constructor(
    private readonly stockService: StockService,
    @Inject(KAFKA_CLIENT)
    private readonly kafka: ClientKafka,
  ) {}

  @EventPattern(ORDERS_EVENTS_TOPIC)
  async onOrderEvent(@Payload() event: OrderCreatedEvent): Promise<void> {
    if (event.type !== 'order.created') {
      return;
    }

    const result = await this.stockService.reserve(event);
    this.logger.log(`${result.type} for order ${event.orderId}`);

    try {
      await lastValueFrom(
        this.kafka.emit(STOCK_EVENTS_TOPIC, {
          key: event.orderId,
          value: result,
        }),
      );
    } catch (error) {
      this.logger.error(`Could not publish ${result.type}`, error);
    }
  }
}
