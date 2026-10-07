import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ClientKafka } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto.js';
import {
  KAFKA_CLIENT,
  ORDERS_EVENTS_TOPIC,
} from './events/order-created.event.js';
import type { OrderCreatedEvent } from './events/order-created.event.js';
import { Order } from './order.entity.js';

// Every method receives the tenantId from the JWT and uses it in the query,
// so one company can never see another company's orders.
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @Inject(KAFKA_CLIENT)
    private readonly kafka: ClientKafka,
  ) {}

  async create(dto: CreateOrderDto, tenantId: string): Promise<Order> {
    const order = await this.orders.save(
      this.orders.create({ ...dto, tenantId }),
    );
    await this.publishOrderCreated(order);
    return order;
  }

  findAll(tenantId: string): Promise<Order[]> {
    return this.orders.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Order> {
    const order = await this.orders.findOneBy({ id, tenantId });
    // An order from another tenant looks exactly like a missing order.
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  // Only a "pending" order can change status, so a late or repeated event
  // can never overwrite an order that is already confirmed or rejected.
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

  private async publishOrderCreated(order: Order): Promise<void> {
    const event: OrderCreatedEvent = {
      eventId: randomUUID(),
      type: 'order.created',
      tenantId: order.tenantId,
      orderId: order.id,
      product: order.product,
      quantity: order.quantity,
      occurredAt: new Date().toISOString(),
    };

    try {
      // The key is the orderId: all events of one order go to the same partition.
      await lastValueFrom(
        this.kafka.emit(ORDERS_EVENTS_TOPIC, { key: order.id, value: event }),
      );
    } catch (error) {
      // The order is already saved, so we log the problem instead of failing.
      this.logger.error(`Could not publish event for order ${order.id}`, error);
    }
  }
}
