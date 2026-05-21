import { useEffect, useMemo, useState,useCallback } from 'react';
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
import { isNetworkError } from '@/src/lib/apiError';

export function useReportCurvatureData() {
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [networkError, setNetworkError] = useState(false);
  const [curvatures, setCurvatures] = useState<CurvatureResponse[]>([]);
  const measurementVersion = useMeasurementRefreshStore((state) => state.version);


  const reload = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {

        setNetworkError(false);
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
        if (isNetworkError(error)) {
          setNetworkError(true);
        }  
        setCurvatures([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [measurementVersion, reloadKey]);

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
    networkError,
    reload,
    latestCurvature,
    hasCurvatureData: curvatures.length > 0,
    myValues,
    avgValues,
    summaryCards,
  };
}
