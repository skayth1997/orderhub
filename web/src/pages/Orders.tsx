import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Order } from '../api';
import { Pager } from './Pager';

const LIMIT = 10;

export function Orders() {
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Order[]>('orderhub', `/orders?page=${page}&limit=${LIMIT}`)
      .then(setOrders)
      .catch((err: Error) => setError(err.message));
  }, [page]);

  return (
    <div className="card">
      <h1>Orders</h1>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.customerName}</td>
              <td>{order.product}</td>
              <td>{order.quantity}</td>
              <td>
                <span className={`badge ${order.status}`}>{order.status}</span>
              </td>
              <td>{new Date(order.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && !error && <p className="muted">No orders yet.</p>}
      <Pager page={page} hasNext={orders.length === LIMIT} onChange={setPage} />
    </div>
  );
}
