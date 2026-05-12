import api from '@/src/api/client';
import type { MeasurementSetResponse } from '@/src/types/measurementSet';

export const measurementSetAPI = {
  getByCurvature: (curvatureId: string | number) =>
    api.get<MeasurementSetResponse>(`/measurement-sets/by-curvature/${curvatureId}`),
};
