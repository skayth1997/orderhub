import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { StockEvent } from '../events/events.js';
import { RabbitService } from '../rabbit/rabbit.service.js';
import { Notification } from './notification.schema.js';

const DUPLICATE_KEY_ERROR = 11000;

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly model: Model<Notification>,
    private readonly rabbit: RabbitService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.model.init();
  }

  async createFromEvent(event: StockEvent): Promise<Notification | null> {
    const message =
      event.type === 'stock.reserved'
        ? `Stock reserved for order ${event.orderId}: ${event.quantity} x ${event.product}`
        : `Order ${event.orderId} rejected: ${event.reason}`;

    try {
      const saved = await this.model.create({
        eventId: event.eventId,
        tenantId: event.tenantId,
        orderId: event.orderId,
        message,
      });
      this.rabbit.publishEmailJob({
        notificationId: String(saved._id),
        tenantId: event.tenantId,
        orderId: event.orderId,
        product: event.product,
        message,
      });
      return saved;
    } catch (error) {
      if ((error as { code?: number }).code === DUPLICATE_KEY_ERROR) {
        this.logger.warn(`Skipped duplicate event ${event.eventId}`);
        return null;
      }
      throw error;
    }
  }

  findForTenant(tenantId: string): Promise<Notification[]> {
    return this.model
      .find({ tenantId })
      .sort({ createdAt: -1 })
      .select('-__v -eventId')
      .lean()
      .exec();
  }
}
