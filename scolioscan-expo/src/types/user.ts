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

