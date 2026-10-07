import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Order } from '../api';
import { useAuth } from '../auth';
import {
  Card,
  EmptyState,
  ErrorBox,
  PageHeader,
  Pager,
  SkeletonRows,
  StatusBadge,
  buttonClass,
} from '../ui';

const LIMIT = 10;
const POLL_MS = 2000;
const POLL_WINDOW_MS = 2 * 60 * 1000;

function isWaiting(order: Order): boolean {
  return (
    order.status === 'pending' &&
    Date.now() - new Date(order.createdAt).getTime() < POLL_WINDOW_MS
  );
}

export function Orders() {
  const { role } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['orders', page],
    queryFn: () =>
      api<Order[]>('orderhub', `/orders?page=${page}&limit=${LIMIT}`),
    refetchInterval: (query) =>
      query.state.data?.some(isWaiting) ? POLL_MS : false,
  });

  const orders = data ?? [];

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Pending orders update by themselves."
        action={
          role !== 'viewer' && (
            <Link to="/orders/new" className={buttonClass}>
              New order
            </Link>
          )
        }
      />
      <Card>
        <ErrorBox error={error} onRetry={() => void refetch()} />
        {isPending && !error && <SkeletonRows />}
        {data && orders.length === 0 && (
          <EmptyState
            title={page === 1 ? 'No orders yet' : 'No more orders'}
            text={
              page === 1 && role !== 'viewer'
                ? 'Create your first order to get started.'
                : undefined
            }
            action={
              page === 1 && role !== 'viewer' ? (
                <Link to="/orders/new" className={buttonClass}>
                  New order
                </Link>
              ) : undefined
            }
          />
        )}
        {orders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="p-2 font-medium">Customer</th>
                  <th className="p-2 font-medium">Product</th>
                  <th className="p-2 font-medium">Qty</th>
                  <th className="p-2 font-medium">Status</th>
                  <th className="p-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100">
                    <td className="p-2">{order.customerName}</td>
                    <td className="p-2">{order.product}</td>
                    <td className="p-2">{order.quantity}</td>
                    <td className="p-2">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {(page > 1 || orders.length > 0) && (
          <Pager
            page={page}
            hasNext={orders.length === LIMIT}
            onChange={setPage}
          />
        )}
      </Card>
    </>
  );
}
