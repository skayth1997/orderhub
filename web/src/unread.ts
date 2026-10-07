import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from './api';
import type { Notification } from './api';

const SEEN_EVENT = 'orderhub:notifications-seen';
const COUNT_LIMIT = 50;

const storageKey = (userId: string) => `orderhub_notifications_seen_${userId}`;

export function readSeen(userId: string): number | null {
  try {
    const value = localStorage.getItem(storageKey(userId));
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

export function writeSeen(userId: string, time: number): void {
  try {
    localStorage.setItem(storageKey(userId), String(time));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

export function useUnreadCount(userId: string | undefined): number {
  const [seen, setSeen] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () =>
      api<Notification[]>(
        'notifications',
        `/notifications?page=1&limit=${COUNT_LIMIT}`,
      ),
    enabled: Boolean(userId),
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!userId) {
      return;
    }
    const update = () => setSeen(readSeen(userId));
    update();
    window.addEventListener(SEEN_EVENT, update);
    return () => window.removeEventListener(SEEN_EVENT, update);
  }, [userId]);

  useEffect(() => {
    if (userId && data && readSeen(userId) === null) {
      const newest = data[0]
        ? new Date(data[0].createdAt).getTime()
        : Date.now();
      writeSeen(userId, newest);
    }
  }, [userId, data]);

  if (!data || seen === null) {
    return 0;
  }
  return data.filter((item) => new Date(item.createdAt).getTime() > seen)
    .length;
}

export { COUNT_LIMIT };
