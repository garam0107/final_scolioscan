import api from '@/src/api/client';
import type { SubscribeResponse } from '@/src/types/subscribe';

export const subscribeAPI = {
  getCurrent: () => api.get<SubscribeResponse | null>('/subscribe/current'),
};
