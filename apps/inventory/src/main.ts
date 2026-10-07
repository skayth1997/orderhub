import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { InventoryModule } from './inventory.module.js';

async function bootstrap() {
  const app = await NestFactory.create(InventoryModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.INVENTORY_PORT ?? 3001);
}
await bootstrap();
