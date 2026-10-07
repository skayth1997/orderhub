import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import type { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './notifications.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const brokers = app
    .get(ConfigService)
    .getOrThrow<string>('KAFKA_BROKERS')
    .split(',');
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: { clientId: 'notifications-consumer', brokers },
      consumer: { groupId: 'notifications-service' },
    },
  });

  await app.startAllMicroservices();
  await app.listen(app.get(ConfigService).getOrThrow('NOTIFICATIONS_PORT'));
}
await bootstrap();
