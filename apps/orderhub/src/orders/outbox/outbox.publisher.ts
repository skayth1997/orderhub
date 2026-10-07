import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { DataSource } from 'typeorm';
import { KAFKA_CLIENT } from '../events/order-created.event.js';
import { OutboxEvent } from './outbox-event.entity.js';

const INTERVAL_MS = 1000;
const BATCH_SIZE = 50;

@Injectable()
export class OutboxPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisher.name);
  private timer: NodeJS.Timeout;
  private busy = false;

  constructor(
    private readonly dataSource: DataSource,
    @Inject(KAFKA_CLIENT)
    private readonly kafka: ClientKafka,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.publishUnsent(), INTERVAL_MS);
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
  }

  private async publishUnsent(): Promise<void> {
    if (this.busy) {
      return;
    }
    this.busy = true;

    try {
      await this.dataSource.transaction(async (manager) => {
        const events = await manager
          .createQueryBuilder(OutboxEvent, 'event')
          .where('event.sentAt IS NULL')
          .orderBy('event.createdAt', 'ASC')
          .limit(BATCH_SIZE)
          .setLock('pessimistic_write')
          .setOnLocked('skip_locked')
          .getMany();

        for (const event of events) {
          await lastValueFrom(
            this.kafka.emit(event.topic, {
              key: event.key,
              value: event.payload,
            }),
          );
          await manager.update(OutboxEvent, event.id, { sentAt: new Date() });
          this.logger.log(`Published ${event.id} to ${event.topic}`);
        }
      });
    } catch (error) {
      this.logger.error('Could not publish outbox events', error);
    } finally {
      this.busy = false;
    }
  }
}
