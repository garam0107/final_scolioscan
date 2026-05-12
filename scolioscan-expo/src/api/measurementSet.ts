import api from '@/src/api/client';
import type { MeasurementSetResponse } from '@/src/types/measurementSet';

type MeasurementSetParams = {
  skip?: number;
  limit?: number;
  from_date?: string;
  to_date?: string;
};

export const measurementSetAPI = {
  getAnalyses: (params?: MeasurementSetParams) =>
    api.get<MeasurementSetResponse[]>('/measurement-sets/', { params }),
  getByCurvature: (curvatureId: string | number) =>
    api.get<MeasurementSetResponse>(`/measurement-sets/by-curvature/${curvatureId}`),
};
