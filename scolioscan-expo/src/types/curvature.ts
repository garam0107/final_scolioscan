export interface CurvatureResponse {
  id: number;
  user_id: string;
  measured_at: string;
  main_thoracic_cobb: number;
  secondary_thoracic_cobb: number;
  lumbar_cobb: number;
  severity: 'normal' | 'mild' | 'moderate' | 'severe';
  back_type:
    | 'Normal'
    | 'Thoracic'
    | 'Double Thoracic'
    | 'Double major'
    | 'Triple curve'
    | 'Lumbar'
    | 'Unknown';
  score?: number | null;
  image_path?: string | null;
  created_at: string;
}
