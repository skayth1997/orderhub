import { getToken } from './auth';

const services = {
  orderhub: '/api/orderhub',
  inventory: '/api/inventory',
  notifications: '/api/notifications',
};

export type Service = keyof typeof services;

export async function api<T>(
  service: Service,
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = getToken();
  const response = await fetch(services[service] + path, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const message = Array.isArray(error?.message)
      ? error.message.join(', ')
      : error?.message;
    throw new Error(message ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export interface Order {
  id: string;
  customerName: string;
  product: string;
  quantity: number;
  status: string;
  createdAt: string;
}

export interface Stock {
  product: string;
  quantity: number;
}

export interface Notification {
  _id: string;
  orderId: string;
  message: string;
  createdAt: string;
}
