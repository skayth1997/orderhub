import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import type { Message } from '@aws-sdk/client-sqs';
import { setTimeout as sleep } from 'node:timers/promises';
import { SqsService } from './sqs.service.js';
import type { SmsJob } from './sqs.service.js';

@Injectable()
export class SmsWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(SmsWorker.name);
  private running = false;

  constructor(private readonly sqs: SqsService) {}

  onApplicationBootstrap(): void {
    this.running = true;
    void this.poll();
  }

  onModuleDestroy(): void {
    this.running = false;
  }

  private async poll(): Promise<void> {
    while (this.running) {
      try {
        const response = await this.sqs.client.send(
          new ReceiveMessageCommand({
            QueueUrl: this.sqs.queueUrl,
            MaxNumberOfMessages: 5,
            WaitTimeSeconds: 10,
          }),
        );
        for (const message of response.Messages ?? []) {
          await this.handle(message);
        }
      } catch (error) {
        this.logger.error('Could not read from SQS', error);
        await sleep(5000);
      }
    }
  }

  private async handle(message: Message): Promise<void> {
    const job = JSON.parse(message.Body as string) as SmsJob;
    try {
      if (job.product === 'BROKEN-SMS') {
        throw new Error('The product BROKEN-SMS always fails');
      }
      this.logger.log(`SMS sent to tenant ${job.tenantId}: "${job.message}"`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `SMS failed for notification ${job.notificationId}: ${reason}. It will come back after the visibility timeout.`,
      );
      return;
    }

    await this.sqs.client.send(
      new DeleteMessageCommand({
        QueueUrl: this.sqs.queueUrl,
        ReceiptHandle: message.ReceiptHandle,
      }),
    );
  }
}
