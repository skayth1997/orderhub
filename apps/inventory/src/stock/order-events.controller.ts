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

// Not an HTTP controller: it receives messages from Kafka.
@Controller()
export class OrderEventsController {
  private readonly logger = new Logger(OrderEventsController.name);

  constructor(
    private readonly stockService: StockService,
    @Inject(KAFKA_CLIENT)
    private readonly kafka: ClientKafka,
  ) {}

  // Runs once for every message on the "orders.events" topic.
  @EventPattern(ORDERS_EVENTS_TOPIC)
  async onOrderEvent(@Payload() event: OrderCreatedEvent): Promise<void> {
    // The topic may carry other kinds of events later. Ignore them.
    if (event.type !== 'order.created') {
      return;
    }

    // If this throws (for example the database is down), Kafka delivers the
    // message again later, which is what we want: nothing was changed yet.
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
      // Stock is already changed. Do NOT throw, or Kafka would re-deliver the
      // order and we would take the stock a second time.
      this.logger.error(`Could not publish ${result.type}`, error);
    }
  }
}
