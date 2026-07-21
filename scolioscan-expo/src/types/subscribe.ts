export type SubscribeResponse = {
  id: string;
  user_uuid: string;
  subscribe_card: string;
  subscribe_type: number;
  started_at: string;
  ended_at: string;
  terminated_at: string | null;
  created_at: string;
};
