import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api';
import type { Order } from '../api';
import { Card, ErrorText } from '../ui';
import { Pager } from './Pager';

const LIMIT = 10;

const badgeClass: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  confirmed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export function Orders() {
  const [page, setPage] = useState(1);
  const { data: orders = [], error } = useQuery({
    queryKey: ['orders', page],
    queryFn: () =>
      api<Order[]>('orderhub', `/orders?page=${page}&limit=${LIMIT}`),
  });

  return (
    <Card title="Orders">
      <ErrorText error={error} />
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="p-2">Customer</th>
            <th className="p-2">Product</th>
            <th className="p-2">Qty</th>
            <th className="p-2">Status</th>
            <th className="p-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-slate-100">
              <td className="p-2">{order.customerName}</td>
              <td className="p-2">{order.product}</td>
              <td className="p-2">{order.quantity}</td>
              <td className="p-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${badgeClass[order.status] ?? ''}`}
                >
                  {order.status}
                </span>
              </td>
              <td className="p-2">
                {new Date(order.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && !error && (
        <p className="mt-3 text-sm text-slate-500">No orders yet.</p>
      )}
      <Pager page={page} hasNext={orders.length === LIMIT} onChange={setPage} />
    </Card>
  );
}
