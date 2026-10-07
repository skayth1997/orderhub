import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { RabbitModule } from '../rabbit/rabbit.module.js';
import { NotificationSchema, Notification } from './notification.schema.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { StockEventsController } from './stock-events.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    AuthModule,
    RabbitModule,
  ],
  controllers: [NotificationsController, StockEventsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
