import api from '@/src/api/client';
import type { RotationCreatePayload, RotationResponse } from '@/src/types/rotation';

export const rotationAPI = {
  createAnalysis: (payload: RotationCreatePayload) =>
    api.post<RotationResponse>('/rotation/', payload),
  getAnalyses: (params?: { skip?: number; limit?: number }) =>
    api.get<RotationResponse[]>('/rotation/', { params }),
  getAnalysis: (analysisId: string) => api.get<RotationResponse>(`/rotation/${analysisId}`),
};
