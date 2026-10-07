import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Me, Notification } from '../api';
import {
  Card,
  EmptyState,
  ErrorBox,
  PageHeader,
  Pager,
  SkeletonRows,
} from '../ui';
import { readSeen, writeSeen } from '../unread';

const LIMIT = 10;

export function Notifications() {
  const [page, setPage] = useState(1);
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('orderhub', '/auth/me'),
  });
  const [seenWhenOpened, setSeenWhenOpened] = useState<number | null>(null);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['notifications', 'page', page],
    queryFn: () =>
      api<Notification[]>(
        'notifications',
        `/notifications?page=${page}&limit=${LIMIT}`,
      ),
  });
  const items = data ?? [];

  useEffect(() => {
    if (me && seenWhenOpened === null) {
      setSeenWhenOpened(readSeen(me.id) ?? Date.now());
    }
  }, [me, seenWhenOpened]);

  useEffect(() => {
    if (me && page === 1 && data && data.length > 0) {
      writeSeen(me.id, new Date(data[0].createdAt).getTime());
    }
  }, [me, page, data]);

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="The newest messages are at the top."
      />
      <Card>
        <ErrorBox error={error} onRetry={() => void refetch()} />
        {isPending && !error && <SkeletonRows />}
        {data && items.length === 0 && (
          <EmptyState
            title={
              page === 1 ? 'No notifications yet' : 'No more notifications'
            }
            text={
              page === 1
                ? 'You will see a message here when an order is confirmed or rejected.'
                : undefined
            }
          />
        )}
        {items.length > 0 && (
          <ul>
            {items.map((item) => {
              const isNew =
                seenWhenOpened !== null &&
                new Date(item.createdAt).getTime() > seenWhenOpened;
              return (
                <li
                  key={item._id}
                  className="flex items-start gap-3 border-b border-slate-100 py-3 text-sm"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isNew ? 'bg-blue-500' : 'bg-transparent'}`}
                  />
                  <div>
                    <div className={isNew ? 'font-medium' : ''}>
                      {item.message}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {(page > 1 || items.length > 0) && (
          <Pager
            page={page}
            hasNext={items.length === LIMIT}
            onChange={setPage}
          />
        )}
      </Card>
    </>
  );
}
