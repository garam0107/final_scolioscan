import api from '@/src/api/client';
import type {
  LoginRequest,
  LoginResponse,
  PasswordResetRequest,
  RegisterRequest,
  MessageCodeRequest
} from '@/src/types/auth';

export const authAPI = {
  login: (credentials: LoginRequest) => api.post<LoginResponse>('/auth/login', credentials),
  register: (data: RegisterRequest) => api.post('/auth/register', data),
  checkEmail: (email: string) => api.get<{ exists: boolean }>(`/auth/check-email/${encodeURIComponent(email)}`),
  checkPhone: (phone :string) => api.get<{exists: boolean}>(`/auth/check-phone/${encodeURIComponent(phone)}`),
  passwordReset: (data: PasswordResetRequest) => api.post('/auth/password-reset', data),
  messageCode : (data : MessageCodeRequest) => api.post('/auth/issue-code', data),
};

