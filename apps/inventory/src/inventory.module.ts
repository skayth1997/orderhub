import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockModule } from './stock/stock.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow('INVENTORY_DB_HOST'),
        port: Number(config.getOrThrow('INVENTORY_DB_PORT')),
        username: config.getOrThrow('INVENTORY_DB_USER'),
        password: config.getOrThrow('INVENTORY_DB_PASSWORD'),
        database: config.getOrThrow('INVENTORY_DB_NAME'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    StockModule,
  ],
})
export class InventoryModule {}
