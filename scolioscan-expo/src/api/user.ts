import api from '@/src/api/client';
import type { UserResponse } from '@/src/types/user';

export const userAPI = {
  getCurrentUser: () => api.get<UserResponse>('/users/me'),
};

