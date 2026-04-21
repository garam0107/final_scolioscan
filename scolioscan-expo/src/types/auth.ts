export interface LoginRequest {
  user_id: string;
  user_pw: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer' | string;
  user_id: string;
  name: string;
  email: string;
}

export interface PasswordResetRequest {
  user_id: string;
  name: string;
}

