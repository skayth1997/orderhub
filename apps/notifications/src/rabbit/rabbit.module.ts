import { Module } from '@nestjs/common';
import { EmailWorker } from './email.worker.js';
import { RabbitService } from './rabbit.service.js';

@Module({
  providers: [RabbitService, EmailWorker],
  exports: [RabbitService],
})
export class RabbitModule {}
