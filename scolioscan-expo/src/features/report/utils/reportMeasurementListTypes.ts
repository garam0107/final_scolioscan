import type { CurvatureResponse } from '@/src/types/curvature';
import type { RotationResponse } from '@/src/types/rotation';

export type ReportMeasurementFilterKey = 'all' | '2d' | 'precise';

export type ReportMeasurementListItem = {
  id: string;
  createdAt: string;
  category: '2d' | 'precise';
  curvature?: CurvatureResponse;
  rotation?: RotationResponse;
  navigationId?: string;
};

export const REPORT_MEASUREMENT_FILTERS: {
  key: ReportMeasurementFilterKey;
  label: string;
}[] = [
  { key: 'all', label: '전체' },
  { key: '2d', label: '2D 측정' },
  { key: 'precise', label: '정교한 측정' },
];
