export const KAFKA_CLIENT = 'KAFKA_CLIENT';

// Topic we READ from (published by the orderhub app).
export const ORDERS_EVENTS_TOPIC = 'orders.events';
// Topic we WRITE to (read by the orderhub app).
export const STOCK_EVENTS_TOPIC = 'stock.events';

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
