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
        host: config.get('INVENTORY_DB_HOST', 'localhost'),
        port: Number(config.get('INVENTORY_DB_PORT', 54321)),
        username: config.get('INVENTORY_DB_USER', 'inventory'),
        password: config.get('INVENTORY_DB_PASSWORD', 'inventory'),
        database: config.get('INVENTORY_DB_NAME', 'inventory'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    StockModule,
  ],
})
export class InventoryModule {}
