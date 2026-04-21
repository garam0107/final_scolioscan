import api from '@/src/api/client';
import type { LoginRequest, LoginResponse, PasswordResetRequest } from '@/src/types/auth';

export const authAPI = {
  login: (credentials: LoginRequest) => api.post<LoginResponse>('/auth/login', credentials),
  register: (data: Record<string, unknown>) => api.post('/auth/register', data),
  passwordReset: (data: PasswordResetRequest) => api.post('/auth/password-reset', data),
};

