export type SocialProvider = 'google' | 'naver' | 'kakao' | 'apple'

export interface SocialAccountStatus {
  is_linked: boolean;
  email: string | null;
}
export interface UserSocialAccounts {
  google: SocialAccountStatus;
  naver: SocialAccountStatus;
  kakao: SocialAccountStatus;
  apple: SocialAccountStatus;
}
export interface UserResponse {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  birthday: string | null;
  sex: boolean | null;
  address: string | null;
  detail_address?: string | null;
  profile_image?: string | null;
  alarm_count: number;
  curvature_limit: number;
  curvature_limit_reset_at: string;
  setting: Record<string, unknown>;
  is_admin: boolean;
  created_at: string;
  social_accounts: UserSocialAccounts;
}


export interface PutUserRequest {
  name: string;
  phone: string;
  address: string | null;
  detail_address?: string | null;
  birthday: string;
  sex: boolean;
}

export interface ChangePasswordRequest {
  current_password : string;
  new_password : string;
  confirm_password : string;
}

export interface DeleteUserRequest {
  password: string;
}
