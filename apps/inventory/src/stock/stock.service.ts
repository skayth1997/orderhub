import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import type {
  OrderCreatedEvent,
  StockRejectedEvent,
  StockReservedEvent,
} from '../events/events.js';
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

  // Takes the ordered quantity out of stock, if there is enough.
  async reserve(
    order: OrderCreatedEvent,
  ): Promise<StockReservedEvent | StockRejectedEvent> {
    const base = {
      eventId: randomUUID(),
      tenantId: order.tenantId,
      orderId: order.orderId,
      product: order.product,
      quantity: order.quantity,
      occurredAt: new Date().toISOString(),
    };

    // One single UPDATE: it only changes the row if quantity is high enough.
    // Doing the check and the change together means two orders at the same
    // time can never take the same items twice.
    const result = await this.stock
      .createQueryBuilder()
      .update(Stock)
      .set({ quantity: () => 'quantity - :amount' })
      .where(
        '"tenantId" = :tenantId AND product = :product AND quantity >= :amount',
        {
          tenantId: order.tenantId,
          product: order.product,
          amount: order.quantity,
        },
      )
      .execute();

    if (result.affected) {
      return { ...base, type: 'stock.reserved' };
    }

    // Nothing was changed. Find out why, to give a clear reason.
    const row = await this.stock.findOneBy({
      tenantId: order.tenantId,
      product: order.product,
    });
    const reason = row
      ? `Not enough stock: requested ${order.quantity}, available ${row.quantity}`
      : `No stock for product "${order.product}"`;
    return { ...base, type: 'stock.rejected', reason };
  }
}
