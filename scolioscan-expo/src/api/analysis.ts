import api from '@/src/api/client';
import type { AnalysisResponse } from '@/src/types/analysis';

export const analysisAPI = {
  getAnalyses: (params?: { skip?: number; limit?: number }) =>
    api.get<AnalysisResponse[]>('/analysis/', { params }),
  getAnalysis: (analysisId: string) => api.get<AnalysisResponse>(`/analysis/${analysisId}`),
};
