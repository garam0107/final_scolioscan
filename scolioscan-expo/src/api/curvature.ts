import api from '@/src/api/client';
import type { CurvatureResponse } from '@/src/types/curvature';

type CurvatureAnalysesParams = {
  skip?: number;
  limit?: number;
  from_date?: string;
  to_date?: string;
};

export const curvatureAPI = {
  getAnalyses: (params?: CurvatureAnalysesParams) =>
    api.get<CurvatureResponse[]>('/curvature/', { params }),
  getAnalysis: (analysisId: string) => api.get<CurvatureResponse>(`/curvature/${analysisId}`),
  postAnalysis: (imageUri: string, fileName = 'upload.jpg', mimeType = 'image/jpeg') => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: fileName,
      type: mimeType,
    } as any);
    return api.post<CurvatureResponse>('/curvature/', formData);
  },
};
