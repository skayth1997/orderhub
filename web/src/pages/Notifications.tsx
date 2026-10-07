import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Notification } from '../api';
import { Pager } from './Pager';

const LIMIT = 10;

export function Notifications() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Notification[]>(
      'notifications',
      `/notifications?page=${page}&limit=${LIMIT}`,
    )
      .then(setItems)
      .catch((err: Error) => setError(err.message));
  }, [page]);

  return (
    <div className="card">
      <h1>Notifications</h1>
      {error && <p className="error">{error}</p>}
      <ul className="list">
        {items.map((item) => (
          <li key={item._id}>
            <div>{item.message}</div>
            <div className="muted">
              {new Date(item.createdAt).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
      {items.length === 0 && !error && (
        <p className="muted">No notifications yet.</p>
      )}
      <Pager page={page} hasNext={items.length === LIMIT} onChange={setPage} />
    </div>
  );
}
