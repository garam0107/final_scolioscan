import api from '@/src/api/client';
import type { RotationResponse } from '@/src/types/rotation';

export const rotationAPI = {
  getAnalyses: (params?: { skip?: number; limit?: number }) =>
    api.get<RotationResponse[]>('/rotation/', { params }),
  getAnalysis: (analysisId: string) => api.get<RotationResponse>(`/rotation/${analysisId}`),
};
