export interface AlarmResponse {
  id: number;
  user_uuid: string;
  alarm_type: number;
  title: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface AlarmUnreadCountResponse {
  count: number;
}
