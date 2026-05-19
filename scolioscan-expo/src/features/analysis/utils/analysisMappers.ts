import type { AnalysisResponse } from '@/src/types/analysis';
import type { CurvatureResponse } from '@/src/types/curvature';
import type { MeasurementSetResponse } from '@/src/types/measurementSet';
import type { RotationResponse } from '@/src/types/rotation';

function getMeasurementDate(
  record:
    | Pick<CurvatureResponse, 'measured_at' | 'created_at'>
    | Pick<RotationResponse, 'measured_at' | 'created_at'>,
) {
  // 측정 시각이 있으면 우선 사용하고, 없을 때만 생성 시각을 분석 표시 기준으로 사용합니다.
  return record.measured_at || record.created_at;
}

export function toAnalysisFromCurvature(record: CurvatureResponse): AnalysisResponse {
  // 2D 굴곡 결과를 분석 화면 공통 모델로 맞춰 화면 로직을 하나로 유지합니다.
  return {
    id: String(record.id),
    user_uuid: record.user_id,
    analysis_type: 1,
    main_thoracic: record.secondary_thoracic_cobb,
    second_thoracic: record.main_thoracic_cobb,
    lumbar: record.lumbar_cobb,
    score: record.score ?? null,
    image_url: record.image_path ?? null,
    created_at: getMeasurementDate(record),
    back_type: record.back_type ?? null,
  };
}

export function toAnalysisFromRotation(record: RotationResponse): AnalysisResponse {
  // 측만각 회전 결과도 같은 분석 모델로 변환해 최신 결과 화면에서 함께 다룹니다.
  return {
    id: String(record.id),
    user_uuid: record.user_id,
    analysis_type: 3,
    main_thoracic: record.upper_thoracic_atr,
    second_thoracic: record.thoracic_atr,
    lumbar: record.lumbar_atr,
    score: null,
    image_url: null,
    created_at: getMeasurementDate(record),
  };
}

export function toAnalysisFromMeasurementSet(
  measurementSet: MeasurementSetResponse,
): AnalysisResponse | null {
  // 같은 측정 세트에 2D와 측만각 결과가 함께 있을 때 화면 표시 우선순위를 정합니다.
  if (measurementSet.curvature) {
    return toAnalysisFromCurvature(measurementSet.curvature);
  }

  if (measurementSet.rotation) {
    return toAnalysisFromRotation(measurementSet.rotation);
  }

  return null;
}
