import api from '@/src/api/client';
import type {
  LoginRequest,
  LoginResponse,
  EmailFindCheckResponse,
  EmailFindRequest,
  EmailFindVerifyResponse,
  PasswordResetAccountRequest,
  PasswordResetAccountResponse,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  PasswordResetVerifyResponse,
  RegisterRequest,
  MessageCodeRequest,
  OctomoApiRequest
} from '@/src/types/auth';

export const authAPI = {
  login: (credentials: LoginRequest) => api.post<LoginResponse>('/auth/login', credentials),
  register: (data: RegisterRequest) => api.post('/auth/register', data),
  checkEmail: (email: string) => api.get<{ exists: boolean }>(`/auth/check-email/${encodeURIComponent(email)}`),
  checkPhone: (phone :string) => api.get<{exists: boolean}>(`/auth/check-phone/${encodeURIComponent(phone)}`),
  checkPasswordResetAccount: (data: PasswordResetAccountRequest) =>
    api.post<PasswordResetAccountResponse>('/auth/password-reset/check', data),
  verifyPasswordReset: (data: PasswordResetAccountRequest) =>
    api.post<PasswordResetVerifyResponse>('/auth/password-reset/verify', data),
  checkEmailFindAccount: (data: EmailFindRequest) =>
    api.post<EmailFindCheckResponse>('/auth/email-find/check', data),
  verifyEmailFind: (data: EmailFindRequest) =>
    api.post<EmailFindVerifyResponse>('/auth/email-find/verify', data),
  confirmPasswordReset: (data: PasswordResetConfirmRequest) =>
    api.post('/auth/password-reset/confirm', data),
  messageCode : (data : MessageCodeRequest) => api.post('/auth/issue-code', data),
  octomoApi : (data : OctomoApiRequest) => api.post('/auth/verify', data),
};

