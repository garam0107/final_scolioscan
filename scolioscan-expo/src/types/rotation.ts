export interface RotationResponse {
  id: number;
  user_id: string;
  measured_at: string;
  upper_thoracic_atr: number;
  lower_thoracic_atr: number;
  thoracolumbar_atr: number;
  upper_lumbar_atr: number;
  lower_lumbar_atr: number;
  thoracic_atr: number;
  lumbar_atr: number;
  max_severity_zone: 'safe' | 'caution' | 'alert';
  created_at: string;
}
