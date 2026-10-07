import { Module } from '@nestjs/common';
import { SmsWorker } from './sms.worker.js';
import { SqsService } from './sqs.service.js';

@Module({
  providers: [SqsService, SmsWorker],
  exports: [SqsService],
})
export class SqsModule {}
