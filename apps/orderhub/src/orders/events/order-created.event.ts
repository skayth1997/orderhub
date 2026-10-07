export const KAFKA_CLIENT = 'KAFKA_CLIENT';
export const ORDERS_EVENTS_TOPIC = 'orders.events';

export interface OrderCreatedEvent {
  eventId: string;
  type: 'order.created';
  tenantId: string;
  orderId: string;
  product: string;
  quantity: number;
  occurredAt: string;
}
