import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { STOCK_EVENTS_TOPIC } from './events/stock-events.js';
import type { StockEvent } from './events/stock-events.js';
import { OrdersService } from './orders.service.js';

// Not an HTTP controller: it receives messages from Kafka.
@Controller()
export class StockEventsController {
  private readonly logger = new Logger(StockEventsController.name);

  constructor(private readonly ordersService: OrdersService) {}

  // Runs once for every message on the "stock.events" topic.
  @EventPattern(STOCK_EVENTS_TOPIC)
  async onStockEvent(@Payload() event: StockEvent): Promise<void> {
    if (event.type === 'stock.reserved') {
      await this.ordersService.updateStatus(
        event.orderId,
        event.tenantId,
        'confirmed',
      );
    } else if (event.type === 'stock.rejected') {
      this.logger.warn(`Order ${event.orderId} rejected: ${event.reason}`);
      await this.ordersService.updateStatus(
        event.orderId,
        event.tenantId,
        'rejected',
      );
    }
  }
}
