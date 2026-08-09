import { apiClient } from '@/lib/apiClient';
import type { AppNotification } from '@/types';

export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data } = await apiClient.get<AppNotification[]>('/notifications');
  return data;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post('/notifications/read-all');
}
