import api from '@/src/api/client';
import type { ChangePasswordRequest, DeleteUserRequest, PutUserRequest, UserResponse } from '@/src/types/user';

export const userAPI = {
  getCurrentUser: () => api.get<UserResponse>('/users/me'),
  updateUserProfile: (data: PutUserRequest) => api.put<UserResponse>('/users/me', data),
  changeUserPassword: (data: ChangePasswordRequest) => api.put('/users/me/password', data),
  deleteCurrentUser: (data: DeleteUserRequest) => api.post('/users/me/delete', data),
};
