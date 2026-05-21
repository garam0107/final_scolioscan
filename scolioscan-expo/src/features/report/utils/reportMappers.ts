import type { MeasurementSetResponse } from '@/src/types/measurementSet';
import type { ReportMeasurementListItem } from '@/src/features/report/utils/reportMeasurementListTypes';
import { getMeasurementDate } from '@/src/features/report/reportTrend';

export function toMeasurementListItem(measurementSet: MeasurementSetResponse): ReportMeasurementListItem | null {
  // 리포트 목록은 만곡 결과가 있는 측정 세트만 상세 화면으로 연결한다.
  if (!measurementSet.curvature) {
    return null;
  }

  const createdAt = getMeasurementDate(measurementSet.curvature);

  return {
    id: `measurement-set-${measurementSet.curvature.id}`,
    createdAt,
    category: '2d',
    measurementSet,
    navigationId: String(measurementSet.curvature.id),
  };
}
