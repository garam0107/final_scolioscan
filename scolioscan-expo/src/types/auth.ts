export interface LoginRequest {
  user_id: string;
  user_pw: string;
  device_id: string;
  device_name: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer' | string;
  user_id: string;
  name: string;
  email: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer' | string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface PasswordResetRequest {
  user_id: string;
  name: string;
}

export interface PasswordResetAccountRequest {
  user_id: string;
  name: string;
  phone: string;
}

export interface PasswordResetAccountResponse {
  exists: boolean;
}

export interface PasswordResetVerifyResponse {
  reset_token: string;
  token_type: 'password_reset' | string;
}

export interface PasswordResetConfirmRequest {
  reset_token: string;
  new_password: string;
  confirm_password: string;
}

export interface EmailFindRequest {
  name: string;
  phone: string;
}

export interface EmailFindCheckResponse {
  exists: boolean;
}

export interface EmailFindVerifyResponse {
  email: string;
}

export interface RegisterRequest {
  user_id: string;
  user_pw: string;
  name: string;
  phone: string;
  birthday: string;
  sex: boolean;
  address: string;
  detail_address?: string | null;
}

export interface MessageCodeRequest {
  phoneNumber : string;
}

export interface MessagCodeResponse {
  phoneNumber : string;
  code : string;
  recipientNumber : string;
  messageText : string;
  expiresAt : string;
  expiresInseconds : string;
}

export interface OctomoApiRequest {
  phoneNumber : string;
}

export interface OctomoApiResponse {
  verified : boolean;
}
