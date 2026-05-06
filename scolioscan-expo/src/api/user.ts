import api from '@/src/api/client';
import type { PutUserRequest, UserResponse } from '@/src/types/user';

export const userAPI = {
  getCurrentUser: () => api.get<UserResponse>('/users/me'),
  updateUserProfile: (data: PutUserRequest) => api.put<UserResponse>('/users/me', data),
};

