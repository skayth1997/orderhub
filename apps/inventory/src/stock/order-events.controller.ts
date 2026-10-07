import { Controller, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ClientKafka } from '@nestjs/microservices';
import { EventPattern, Payload } from '@nestjs/microservices';
import { setTimeout as sleep } from 'node:timers/promises';
import { lastValueFrom } from 'rxjs';
import {
  KAFKA_CLIENT,
  ORDERS_DLQ_TOPIC,
  ORDERS_EVENTS_TOPIC,
  STOCK_EVENTS_TOPIC,
} from '../events/events.js';
import type { OrderCreatedEvent } from '../events/events.js';
import { StockService } from './stock.service.js';

@Controller()
export class OrderEventsController {
  private readonly logger = new Logger(OrderEventsController.name);
  private readonly retryDelaysMs: number[];
  private readonly maxAttempts: number;

  constructor(
    private readonly stockService: StockService,
    @Inject(KAFKA_CLIENT)
    private readonly kafka: ClientKafka,
    config: ConfigService,
  ) {
    this.retryDelaysMs = config
      .getOrThrow<string>('INVENTORY_RETRY_DELAYS_MS')
      .split(',')
      .map(Number);
    this.maxAttempts = this.retryDelaysMs.length + 1;
  }

  @EventPattern(ORDERS_EVENTS_TOPIC)
  async onOrderEvent(@Payload() event: OrderCreatedEvent): Promise<void> {
    if (event.type !== 'order.created') {
      return;
    }

    let lastError: unknown;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      this.logger.log(
        `Attempt ${attempt}/${this.maxAttempts} for order ${event.orderId}`,
      );
      try {
        const result = await this.stockService.reserve(event);
        if (!result) {
          this.logger.warn(`Skipped duplicate event ${event.eventId}`);
          return;
        }
        this.logger.log(`${result.type} for order ${event.orderId}`);
        await this.publish(STOCK_EVENTS_TOPIC, event.orderId, result);
        return;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Attempt ${attempt}/${this.maxAttempts} failed for order ${event.orderId}: ${errorMessage(error)}`,
        );
        if (attempt < this.maxAttempts) {
          const delay = this.retryDelaysMs[attempt - 1];
          this.logger.log(`Retrying in ${delay / 1000}s`);
          await sleep(delay);
        }
      }
    }

    this.logger.error(
      `Giving up on order ${event.orderId}, sending to ${ORDERS_DLQ_TOPIC}`,
    );
    await this.publish(ORDERS_DLQ_TOPIC, event.orderId, {
      error: errorMessage(lastError),
      originalTopic: ORDERS_EVENTS_TOPIC,
      attempts: this.maxAttempts,
      event,
    });
  }

  private async publish(
    topic: string,
    key: string,
    value: object,
  ): Promise<void> {
    try {
      await lastValueFrom(this.kafka.emit(topic, { key, value }));
    } catch (error) {
      this.logger.error(`Could not publish to ${topic}`, error);
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
