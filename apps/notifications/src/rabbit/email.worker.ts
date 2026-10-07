import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import type { ConsumeMessage } from 'amqplib';
import {
  EMAIL_QUEUE,
  EMAIL_RETRY_QUEUE,
  RabbitService,
} from './rabbit.service.js';
import type { EmailJob } from './rabbit.service.js';

const MAX_ATTEMPTS = 3;

@Injectable()
export class EmailWorker implements OnApplicationBootstrap {
  private readonly logger = new Logger(EmailWorker.name);

  constructor(private readonly rabbit: RabbitService) {}

  async onApplicationBootstrap(): Promise<void> {
    const channel = this.rabbit.channel;
    await channel.prefetch(1);
    await channel.consume(
      EMAIL_QUEUE,
      (msg) => {
        if (msg) {
          this.handle(msg);
        }
      },
      { noAck: false },
    );
  }

  private handle(msg: ConsumeMessage): void {
    const channel = this.rabbit.channel;
    const job = JSON.parse(msg.content.toString()) as EmailJob;
    const attempt = Number(msg.properties.headers?.['x-attempts'] ?? 0) + 1;

    try {
      this.sendEmail(job);
      channel.ack(msg);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Email attempt ${attempt}/${MAX_ATTEMPTS} failed for notification ${job.notificationId}: ${reason}`,
      );

      if (attempt >= MAX_ATTEMPTS) {
        this.logger.error(
          `Giving up on notification ${job.notificationId}, sending to the dead-letter queue`,
        );
        channel.nack(msg, false, false);
        return;
      }

      channel.sendToQueue(EMAIL_RETRY_QUEUE, msg.content, {
        persistent: true,
        headers: { 'x-attempts': attempt },
      });
      channel.ack(msg);
    }
  }

  private sendEmail(job: EmailJob): void {
    if (job.product === 'BROKEN-EMAIL') {
      throw new Error('The product BROKEN-EMAIL always fails');
    }
    this.logger.log(`Email sent to tenant ${job.tenantId}: "${job.message}"`);
  }
}
