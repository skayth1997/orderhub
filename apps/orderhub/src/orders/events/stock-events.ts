export const STOCK_EVENTS_TOPIC = 'stock.events';

interface StockEventBase {
  eventId: string;
  tenantId: string;
  orderId: string;
  product: string;
  quantity: number;
  occurredAt: string;
}

export interface StockReservedEvent extends StockEventBase {
  type: 'stock.reserved';
}

export interface StockRejectedEvent extends StockEventBase {
  type: 'stock.rejected';
  reason: string;
}

export type StockEvent = StockReservedEvent | StockRejectedEvent;
