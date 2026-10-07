import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SetStockDto } from './dto/set-stock.dto.js';
import { Stock } from './stock.entity.js';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stock: Repository<Stock>,
  ) {}

  // Creates the row, or updates it if this tenant already has this product.
  async set(dto: SetStockDto, tenantId: string): Promise<Stock> {
    const row = { tenantId, product: dto.product, quantity: dto.quantity };
    await this.stock.upsert(row, ['tenantId', 'product']);
    return row;
  }
}
