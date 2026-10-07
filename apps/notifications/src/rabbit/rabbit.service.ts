import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp from 'amqplib';

export const EMAIL_QUEUE = 'email.send';
export const EMAIL_RETRY_QUEUE = 'email.retry';
export const EMAIL_DLQ = 'email.dlq';
const EMAIL_DLX = 'email.dlx';
const RETRY_DELAY_MS = 5000;

export interface EmailJob {
  notificationId: string;
  tenantId: string;
  orderId: string;
  product: string;
  message: string;
}

@Injectable()
export class RabbitService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitService.name);
  private connection: amqp.ChannelModel;
  channel: amqp.Channel;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.connection = await amqp.connect(
      this.config.get('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672'),
    );
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(EMAIL_DLX, 'direct', { durable: true });
    await this.channel.assertQueue(EMAIL_DLQ, { durable: true });
    await this.channel.bindQueue(EMAIL_DLQ, EMAIL_DLX, 'email.failed');

    await this.channel.assertQueue(EMAIL_QUEUE, {
      durable: true,
      deadLetterExchange: EMAIL_DLX,
      deadLetterRoutingKey: 'email.failed',
    });

    await this.channel.assertQueue(EMAIL_RETRY_QUEUE, {
      durable: true,
      messageTtl: RETRY_DELAY_MS,
      deadLetterExchange: '',
      deadLetterRoutingKey: EMAIL_QUEUE,
    });

    this.logger.log('Connected to RabbitMQ');
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  publishEmailJob(job: EmailJob): void {
    this.channel.sendToQueue(EMAIL_QUEUE, Buffer.from(JSON.stringify(job)), {
      persistent: true,
    });
  }
}
