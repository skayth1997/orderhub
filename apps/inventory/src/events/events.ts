export const KAFKA_CLIENT = 'KAFKA_CLIENT';

export const ORDERS_EVENTS_TOPIC = 'orders.events';

export const STOCK_EVENTS_TOPIC = 'stock.events';

export const ORDERS_DLQ_TOPIC = 'orders.events.dlq';

export interface OrderCreatedEvent {
  eventId: string;
  type: 'order.created';
  tenantId: string;
  orderId: string;
  product: string;
  quantity: number;
  occurredAt: string;
}

export interface StockReservedEvent {
  eventId: string;
  type: 'stock.reserved';
  tenantId: string;
  orderId: string;
  product: string;
  quantity: number;
  occurredAt: string;
}

export interface StockRejectedEvent {
  eventId: string;
  type: 'stock.rejected';
  tenantId: string;
  orderId: string;
  product: string;
  quantity: number;
  reason: string;
  occurredAt: string;
}
