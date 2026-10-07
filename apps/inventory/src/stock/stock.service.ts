import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Redis } from 'ioredis';
import { randomUUID } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import type {
  OrderCreatedEvent,
  StockRejectedEvent,
  StockReservedEvent,
} from '../events/events.js';
import { SetStockDto } from './dto/set-stock.dto.js';
import { ProcessedEvent } from './processed-event.entity.js';
import { REDIS_CLIENT } from './redis.js';
import { Stock } from './stock.entity.js';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stock: Repository<Stock>,
    private readonly dataSource: DataSource,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  private cacheKey(tenantId: string, product: string): string {
    return `stock:${tenantId}:${product}`;
  }

  async get(tenantId: string, product: string): Promise<Stock> {
    const key = this.cacheKey(tenantId, product);

    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached) as Stock;
    }

    const row = await this.stock.findOneBy({ tenantId, product });
    if (!row) {
      throw new NotFoundException(`No stock for product "${product}"`);
    }

    await this.redis.set(
      key,
      JSON.stringify(row),
      'EX',
      Number(this.config.getOrThrow('STOCK_CACHE_SECONDS')),
    );
    return row;
  }

  async set(dto: SetStockDto, tenantId: string): Promise<Stock> {
    const row = { tenantId, product: dto.product, quantity: dto.quantity };
    await this.stock.upsert(row, ['tenantId', 'product']);
    await this.redis.del(this.cacheKey(tenantId, dto.product));
    return row;
  }

  async reserve(
    order: OrderCreatedEvent,
  ): Promise<StockReservedEvent | StockRejectedEvent | null> {
    const base = {
      eventId: randomUUID(),
      tenantId: order.tenantId,
      orderId: order.orderId,
      product: order.product,
      quantity: order.quantity,
      occurredAt: new Date().toISOString(),
    };

    const result = await this.dataSource.transaction(async (manager) => {
      const saved = await manager
        .createQueryBuilder()
        .insert()
        .into(ProcessedEvent)
        .values({ eventId: order.eventId })
        .orIgnore()
        .returning('"eventId"')
        .execute();

      if (saved.raw.length === 0) {
        return null;
      }

      if (order.product === 'BROKEN') {
        throw new Error('The product BROKEN always fails');
      }

      const update = await manager
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

      if (update.affected) {
        return { ...base, type: 'stock.reserved' } as StockReservedEvent;
      }

      const row = await manager.findOneBy(Stock, {
        tenantId: order.tenantId,
        product: order.product,
      });
      const reason = row
        ? `Not enough stock: requested ${order.quantity}, available ${row.quantity}`
        : `No stock for product "${order.product}"`;
      return { ...base, type: 'stock.rejected', reason } as StockRejectedEvent;
    });

    if (result?.type === 'stock.reserved') {
      await this.redis.del(this.cacheKey(order.tenantId, order.product));
    }
    return result;
  }
}
