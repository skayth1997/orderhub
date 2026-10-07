import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { ORDERS_EVENTS_TOPIC } from './events/order-created.event.js';
import type { OrderCreatedEvent } from './events/order-created.event.js';
import { Order } from './order.entity.js';
import { OutboxEvent } from './outbox/outbox-event.entity.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateOrderDto, tenantId: string): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.save(
        this.orders.create({
          customerName: dto.customerName,
          product: dto.product,
          quantity: dto.quantity,
          tenantId,
        }),
      );

      const event: OrderCreatedEvent = {
        eventId: randomUUID(),
        type: 'order.created',
        tenantId: order.tenantId,
        orderId: order.id,
        product: order.product,
        quantity: order.quantity,
        occurredAt: new Date().toISOString(),
      };
      await manager.save(
        manager.create(OutboxEvent, {
          topic: ORDERS_EVENTS_TOPIC,
          key: order.id,
          payload: event,
        }),
      );

      return order;
    });
  }

  findAll(tenantId: string, page = 1, limit = 20): Promise<Order[]> {
    return this.orders.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: string, tenantId: string): Promise<Order> {
    const order = await this.orders.findOneBy({ id, tenantId });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  async updateStatus(
    orderId: string,
    tenantId: string,
    status: 'confirmed' | 'rejected',
  ): Promise<void> {
    const result = await this.orders.update(
      { id: orderId, tenantId, status: 'pending' },
      { status },
    );
    if (result.affected) {
      this.logger.log(`Order ${orderId} is now ${status}`);
    }
  }
}
