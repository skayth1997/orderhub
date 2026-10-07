import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Notification {
  @Prop({ required: true, unique: true })
  eventId: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  message: string;

  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
