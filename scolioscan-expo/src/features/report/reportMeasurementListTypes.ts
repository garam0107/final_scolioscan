import type { MeasurementSetResponse } from '@/src/types/measurementSet';

export type ReportMeasurementFilterKey = 'all' | '2d' | '3d';

export type ReportMeasurementListItem = {
  id: string;
  createdAt: string;
  category: '2d' | '3d';
  measurementSet: MeasurementSetResponse;
  navigationId?: string;
};

export const REPORT_MEASUREMENT_FILTERS: {
  key: ReportMeasurementFilterKey;
  label: string;
}[] = [
  { key: 'all', label: '전체' },
  { key: '2d', label: '2D 측정' },
  { key: '3d', label: '3D 스캔' },
];
