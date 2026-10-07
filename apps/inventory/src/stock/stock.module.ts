import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Stock } from './stock.entity.js';
import { StockController } from './stock.controller.js';
import { StockService } from './stock.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Stock]), AuthModule],
  controllers: [StockController],
  providers: [StockService],
})
export class StockModule {}
