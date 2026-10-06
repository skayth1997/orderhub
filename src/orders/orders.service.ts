import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { Order } from './order.entity.js';

// Every method receives the tenantId from the JWT and uses it in the query,
// so one company can never see another company's orders.
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
  ) {}

  create(dto: CreateOrderDto, tenantId: string): Promise<Order> {
    return this.orders.save(this.orders.create({ ...dto, tenantId }));
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
}
