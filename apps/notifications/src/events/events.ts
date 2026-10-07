export const STOCK_EVENTS_TOPIC = 'stock.events';

export interface StockEvent {
  eventId: string;
  type: 'stock.reserved' | 'stock.rejected';
  tenantId: string;
  orderId: string;
  product: string;
  quantity: number;
  reason?: string;
  occurredAt: string;
}
