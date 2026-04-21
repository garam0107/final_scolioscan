import api from '@/src/api/client';
import type { AlarmResponse, AlarmUnreadCountResponse } from '@/src/types/alarm';

export const alarmAPI = {
  getAlarms: () => api.get<AlarmResponse[]>('/alarms/'),
  getUnreadCount: () => api.get<AlarmUnreadCountResponse>('/alarms/unread-count'),
  markAsRead: (alarmId: number) => api.post(`/alarms/${alarmId}/read`),
  markAllAsRead: () => api.post('/alarms/read-all'),
};
