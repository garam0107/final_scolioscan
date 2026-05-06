import api from '@/src/api/client';
import type { PutUserRequest, UserResponse, ChangePasswordRequest } from '@/src/types/user';

export const userAPI = {
  getCurrentUser: () => api.get<UserResponse>('/users/me'),
  updateUserProfile: (data: PutUserRequest) => api.put<UserResponse>('/users/me', data),
  changeUserPassword: (data: ChangePasswordRequest) => api.put('/users/me/password', data)
};

