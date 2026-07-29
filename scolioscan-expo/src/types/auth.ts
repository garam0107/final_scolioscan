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

export type SocialProvider = 'google' | 'kakao' | 'naver' | 'apple';

export interface SocialLoginSuccessResponse {
  status: 'login_success';
  provider: SocialProvider;
  provider_user_id: string;
  provider_email?: string | null;
  linked_user_id?: string | null;
  social_temp_token?: null;
  access_token: string;
  refresh_token: string;
  token_type: 'bearer' | string;
  user_id?: string | null;
  name?: string | null;
  email?: string | null;
  verified_at: string;
}

export interface SocialDecisionRequiredResponse {
  status: 'need_account_decision';
  provider: SocialProvider;
  provider_user_id: string;
  provider_email?: string | null;
  linked_user_id?: null;
  social_temp_token: string;
  access_token?: null;
  refresh_token?: null;
  token_type?: null;
  user_id?: null;
  name?: null;
  email?: null;
  verified_at: string;
}

export type SocialAuthResponse = SocialLoginSuccessResponse | SocialDecisionRequiredResponse;

export interface GoogleVerifyRequest {
  id_token: string;
  device_id: string;
  device_name: string;
}

export interface KakaoVerifyRequest {
  access_token: string;
  device_id: string;
  device_name: string;
}

export interface NaverVerifyRequest {
  access_token: string;
  device_id: string;
  device_name: string;
}

export interface AppleVerifyRequest {
  identity_token: string;
  authorization_code: string;
  device_id: string;
  device_name: string;
}

export interface SocialLinkExistingRequest {
  social_temp_token: string;
  user_id: string;
  user_pw: string;
  device_id: string;
  device_name: string;
}

export interface SocialLinkCurrentRequest {
  social_temp_token: string;
}

export interface SocialSignupRequest extends RegisterRequest {
  social_temp_token: string;
  device_id: string;
  device_name: string;
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
