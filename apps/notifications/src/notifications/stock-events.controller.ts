import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { STOCK_EVENTS_TOPIC } from '../events/events.js';
import type { StockEvent } from '../events/events.js';
import { NotificationsService } from './notifications.service.js';

@Controller()
export class StockEventsController {
  constructor(private readonly notifications: NotificationsService) {}

  @EventPattern(STOCK_EVENTS_TOPIC)
  async onStockEvent(@Payload() event: StockEvent): Promise<void> {
    await this.notifications.createFromEvent(event);
  }
}
