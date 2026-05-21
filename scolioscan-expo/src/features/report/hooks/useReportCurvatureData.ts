import { useEffect, useMemo, useState } from 'react';
import { curvatureAPI } from '@/src/api/curvature';
import { useMeasurementRefreshStore } from '@/src/store/measurementRefreshStore';
import type { CurvatureResponse } from '@/src/types/curvature';
import { CURVATURE_METRIC_LABELS, formatRoundedDegree } from '@/src/features/report/utils/reportFormatters';
import {
  getMeasurementDate,
  getRecentDateRange,
  REPORT_CURVATURE_DAYS,
  type TrendAngleKey,
} from '@/src/features/report/reportTrend';

export function useReportCurvatureData() {
  const [curvatures, setCurvatures] = useState<CurvatureResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const measurementVersion = useMeasurementRefreshStore((state) => state.version);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        // 리포트 상단 그래프는 측정 목록 필터와 별개로 최근 기간 기준 데이터를 사용한다.
        const response = await curvatureAPI.getAnalyses({
          limit: 1000,
          ...getRecentDateRange(REPORT_CURVATURE_DAYS),
        });

        if (!active) return;

        const sortedCurvatures = [...response.data].sort(
          (left, right) =>
            new Date(getMeasurementDate(right)).getTime() - new Date(getMeasurementDate(left)).getTime(),
        );
        setCurvatures(sortedCurvatures);
      } catch (error) {
        console.error('Failed to load curvatures:', error);
        setCurvatures([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [measurementVersion]);

  const latestCurvature = useMemo(() => curvatures[0] ?? null, [curvatures]);

  const myValues: [number, number, number] = [
    Math.abs(latestCurvature?.secondary_thoracic_cobb ?? 0),
    Math.abs(latestCurvature?.main_thoracic_cobb ?? 0),
    Math.abs(latestCurvature?.lumbar_cobb ?? 0),
  ];

  const avgValues: [number, number, number] = [18, 18, 18];

  const summaryCards: { key: TrendAngleKey; label: string; value: string }[] = [
    {
      key: 'proximal',
      label: CURVATURE_METRIC_LABELS[0],
      value: formatRoundedDegree(latestCurvature?.secondary_thoracic_cobb),
    },
    {
      key: 'main',
      label: CURVATURE_METRIC_LABELS[1],
      value: formatRoundedDegree(latestCurvature?.main_thoracic_cobb),
    },
    {
      key: 'lumbar',
      label: CURVATURE_METRIC_LABELS[2],
      value: formatRoundedDegree(latestCurvature?.lumbar_cobb),
    },
  ];

  return {
    curvatures,
    loading,
    latestCurvature,
    hasCurvatureData: curvatures.length > 0,
    myValues,
    avgValues,
    summaryCards,
  };
}
