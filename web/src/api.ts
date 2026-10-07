import { UNAUTHORIZED_EVENT, getToken } from './auth';

const services = {
  orderhub: '/api/orderhub',
  inventory: '/api/inventory',
  notifications: '/api/notifications',
};

export type Service = keyof typeof services;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function friendlyMessage(status: number, serverMessage?: string): string {
  if (status === 403) {
    return 'You do not have permission to do this.';
  }
  if (status === 429) {
    return 'Too many requests. Please wait a minute and try again.';
  }
  if (status >= 500) {
    return 'Something went wrong on the server. Please try again.';
  }
  return serverMessage ?? `The request failed (error ${status}).`;
}

export async function api<T>(
  service: Service,
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(services[service] + path, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      'Cannot reach the server. Check that the backend is running and try again.',
    );
  }

  if (response.status === 401 && token) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const serverMessage = Array.isArray(error?.message)
      ? error.message.join(', ')
      : error?.message;
    throw new ApiError(
      response.status,
      friendlyMessage(response.status, serverMessage),
    );
  }
  return response.json() as Promise<T>;
}

export type Role = 'admin' | 'manager' | 'viewer';

export interface Me {
  id: string;
  email: string;
  role: Role;
  tenantId: string;
  companyName: string;
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

export interface TeamUser {
  id: string;
  email: string;
  role: Role;
}
