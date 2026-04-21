export interface AnalysisResponse {
  id: string;
  user_uuid: string;
  analysis_type: number;
  main_thoracic: number;
  second_thoracic?: number | null;
  lumbar: number;
  score?: number | null;
  image_url?: string | null;
  created_at: string;
}
