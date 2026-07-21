import type { CurvatureResponse } from '@/src/types/curvature';
import type { RotationResponse } from '@/src/types/rotation';
import type { ReportMeasurementListItem } from '@/src/features/report/utils/reportMeasurementListTypes';
import { getMeasurementDate } from '@/src/features/report/reportTrend';

export function toMeasurementListItems(
  curvatures: CurvatureResponse[],
  rotations: RotationResponse[],
): ReportMeasurementListItem[] {
  // 리포트 목록은 2D와 정교한 측정 기록을 각각 독립된 카드로 만든다.
  return [
    ...curvatures.map((curvature) => ({
      id: `curvature-${curvature.id}`,
      createdAt: getMeasurementDate(curvature),
      category: '2d' as const,
      curvature,
      navigationId: String(curvature.id),
    })),
    ...rotations.map((rotation) => ({
      id: `rotation-${rotation.id}`,
      createdAt: getMeasurementDate(rotation),
      category: 'precise' as const,
      rotation,
      navigationId: rotation.curvature_measurement_id
        ? String(rotation.curvature_measurement_id)
        : undefined,
    })),
  ];
}
