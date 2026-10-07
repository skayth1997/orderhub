import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import type { MicroserviceOptions } from '@nestjs/microservices';
import { InventoryModule } from './inventory.module.js';

async function bootstrap() {
  const app = await NestFactory.create(InventoryModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Besides HTTP, this app also listens to Kafka (the Kafka consumer).
  const brokers = app
    .get(ConfigService)
    .get<string>('KAFKA_BROKERS', 'localhost:9092')
    .split(',');
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: { clientId: 'inventory-consumer', brokers },
      // Consumers with the same groupId share the work of a topic.
      consumer: { groupId: 'inventory-service' },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.INVENTORY_PORT ?? 3001);
}
await bootstrap();
