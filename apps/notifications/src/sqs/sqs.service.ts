import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateQueueCommand,
  GetQueueAttributesCommand,
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';

const SMS_QUEUE = 'sms-send';
const SMS_DLQ = 'sms-send-dlq';

export interface SmsJob {
  notificationId: string;
  tenantId: string;
  orderId: string;
  product: string;
  message: string;
}

@Injectable()
export class SqsService implements OnModuleInit {
  private readonly logger = new Logger(SqsService.name);
  readonly client: SQSClient;
  queueUrl: string;

  constructor(config: ConfigService) {
    this.client = new SQSClient({
      region: config.get('AWS_REGION', 'us-east-1'),
      endpoint: config.get('SQS_ENDPOINT', 'http://localhost:4566'),
    });
  }

  async onModuleInit(): Promise<void> {
    const dlq = await this.client.send(
      new CreateQueueCommand({ QueueName: SMS_DLQ }),
    );
    const attributes = await this.client.send(
      new GetQueueAttributesCommand({
        QueueUrl: dlq.QueueUrl,
        AttributeNames: ['QueueArn'],
      }),
    );

    const queue = await this.client.send(
      new CreateQueueCommand({
        QueueName: SMS_QUEUE,
        Attributes: {
          VisibilityTimeout: '10',
          RedrivePolicy: JSON.stringify({
            deadLetterTargetArn: attributes.Attributes?.QueueArn,
            maxReceiveCount: '3',
          }),
        },
      }),
    );
    this.queueUrl = queue.QueueUrl as string;
    this.logger.log(`SQS queue ready: ${this.queueUrl}`);
  }

  async publishSmsJob(job: SmsJob): Promise<void> {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(job),
      }),
    );
  }
}
