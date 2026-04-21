import api from '@/src/api/client';
import type { CurvatureResponse } from '@/src/types/curvature';

export const curvatureAPI = {
  getAnalyses: (params?: { skip?: number; limit?: number }) =>
    api.get<CurvatureResponse[]>('/curvature/', { params }),
  getAnalysis: (analysisId: string) => api.get<CurvatureResponse>(`/curvature/${analysisId}`),
};
