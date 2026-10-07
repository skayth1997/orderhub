import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api';
import type { Notification } from '../api';
import { Card, ErrorText } from '../ui';
import { Pager } from './Pager';

const LIMIT = 10;

export function Notifications() {
  const [page, setPage] = useState(1);
  const { data: items = [], error } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () =>
      api<Notification[]>(
        'notifications',
        `/notifications?page=${page}&limit=${LIMIT}`,
      ),
  });

  return (
    <Card title="Notifications">
      <ErrorText error={error} />
      <ul>
        {items.map((item) => (
          <li key={item._id} className="border-b border-slate-100 py-2 text-sm">
            <div>{item.message}</div>
            <div className="text-slate-500">
              {new Date(item.createdAt).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
      {items.length === 0 && !error && (
        <p className="text-sm text-slate-500">No notifications yet.</p>
      )}
      <Pager page={page} hasNext={items.length === LIMIT} onChange={setPage} />
    </Card>
  );
}
