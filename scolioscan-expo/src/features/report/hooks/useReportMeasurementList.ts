import { useEffect, useMemo, useState, useCallback } from 'react';
import { curvatureAPI } from '@/src/api/curvature';
import { rotationAPI } from '@/src/api/rotation';
import { useMeasurementRefreshStore } from '@/src/store/measurementRefreshStore';
import type { CurvatureResponse } from '@/src/types/curvature';
import type { RotationResponse } from '@/src/types/rotation';
import { getMonthDateRange } from '@/src/features/report/utils/reportMonthFilter';
import type {
  ReportMeasurementFilterKey,
} from '@/src/features/report/utils/reportMeasurementListTypes';
import { toMeasurementListItems } from '@/src/features/report/utils/reportMappers';
import { isNetworkError } from '@/src/lib/apiError';
import { getMeasurementDate } from '@/src/features/report/reportTrend';


type UseReportMeasurementListParams = {
  monthMode: 'all' | 'specific';
  selectedYear: number;
  selectedMonth: number;
  selectedFilter: ReportMeasurementFilterKey;
};

export function useReportMeasurementList({
  monthMode,
  selectedYear,
  selectedMonth,
  selectedFilter,
}: UseReportMeasurementListParams) {
  const [curvatures, setCurvatures] = useState<CurvatureResponse[]>([]);
  const [rotations, setRotations] = useState<RotationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const measurementVersion = useMeasurementRefreshStore((state) => state.version);
  const [networkError, setNetworkError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);
  useEffect(() => {
    let active = true;

    const loadMeasurementList = async () => {
      try {
        setNetworkError(false);
        setLoading(true);
        // 전체는 날짜 파라미터 없이 조회하고, 지정 월은 해당 월의 시작일과 마지막일만 조회한다.
        const [curvatureResponse, rotationResponse] = await Promise.all([
          curvatureAPI.getAnalyses({
            limit: 1000,
            ...(monthMode === 'specific' ? getMonthDateRange(selectedYear, selectedMonth) : {}),
          }),
          rotationAPI.getAnalyses({ limit: 1000 }),
        ]);

        if (!active) return;

        // rotation 목록 API에는 날짜 필터가 없어 선택한 달은 클라이언트에서 같은 기준으로 거른다.
        const selectedRotations = monthMode === 'specific'
          ? rotationResponse.data.filter((rotation) => {
              const measuredAt = new Date(getMeasurementDate(rotation));
              return measuredAt.getFullYear() === selectedYear && measuredAt.getMonth() + 1 === selectedMonth;
            })
          : rotationResponse.data;

        setCurvatures(curvatureResponse.data);
        setRotations(selectedRotations);
      } catch (error) {
        if (isNetworkError(error)) {
            setNetworkError(true);
          }
        setCurvatures([]);
        setRotations([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadMeasurementList();

    return () => {
      active = false;
    };
  }, [measurementVersion, monthMode, selectedMonth, selectedYear, reloadKey]);

  const listItems = useMemo(() => {
    // 서버 응답을 화면 목록 전용 형태로 바꾸고 최신 측정순으로 정렬한다.
    const items = toMeasurementListItems(curvatures, rotations);

    return items.sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }, [curvatures, rotations]);

  const filteredItems = useMemo(() => {
    if (selectedFilter === 'all') return listItems;
    return listItems.filter((item) => item.category === selectedFilter);
  }, [listItems, selectedFilter]);

  return {
    networkError,
    reload,
    loading,
    listItems,
    filteredItems,
  };
}
