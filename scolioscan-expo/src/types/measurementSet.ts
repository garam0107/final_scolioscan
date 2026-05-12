import type { CurvatureResponse } from '@/src/types/curvature';
import type { RotationResponse } from '@/src/types/rotation';

export type MeasurementSetResponse = {
  curvature: CurvatureResponse | null;
  rotation: RotationResponse | null;
};
