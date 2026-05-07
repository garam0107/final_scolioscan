export interface UserResponse {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  birthday: string;
  sex: boolean;
  address: string;
  detail_address?: string | null;
  profile_image?: string | null;
  alarm_count: number;
  setting: Record<string, unknown>;
  is_admin: boolean;
  created_at: string;
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
