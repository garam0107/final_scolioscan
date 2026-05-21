import { useEffect, useMemo, useState, useCallback } from 'react';
import { measurementSetAPI } from '@/src/api/measurementSet';
import { useMeasurementRefreshStore } from '@/src/store/measurementRefreshStore';
import type { MeasurementSetResponse } from '@/src/types/measurementSet';
import { getMonthDateRange } from '@/src/features/report/utils/reportMonthFilter';
import type {
  ReportMeasurementFilterKey,
  ReportMeasurementListItem,
} from '@/src/features/report/utils/reportMeasurementListTypes';
import { toMeasurementListItem } from '@/src/features/report/utils/reportMappers';
import { isNetworkError } from '@/src/lib/apiError';


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
  const [measurementSets, setMeasurementSets] = useState<MeasurementSetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const measurementVersion = useMeasurementRefreshStore((state) => state.version);
  const [networkError, setNetworkError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);
  useEffect(() => {
    let active = true;

    const loadMeasurementSets = async () => {
      try {
        setNetworkError(false);
        setLoading(true);
        // 전체는 날짜 파라미터 없이 조회하고, 지정 월은 해당 월의 시작일과 마지막일만 조회한다.
        const response = await measurementSetAPI.getAnalyses({
          limit: 1000,
          ...(monthMode === 'specific' ? getMonthDateRange(selectedYear, selectedMonth) : {}),
        });

        if (!active) return;

        setMeasurementSets(response.data);
      } catch (error) {
        if (isNetworkError(error)) {
            setNetworkError(true);
          }
        setMeasurementSets([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadMeasurementSets();

    return () => {
      active = false;
    };
  }, [measurementVersion, monthMode, selectedMonth, selectedYear, reloadKey]);

  const listItems = useMemo(() => {
    // 서버 응답을 화면 목록 전용 형태로 바꾸고 최신 측정순으로 정렬한다.
    const items = measurementSets
      .map(toMeasurementListItem)
      .filter((item): item is ReportMeasurementListItem => item !== null);

    return items.sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }, [measurementSets]);

  const filteredItems = useMemo(() => {
    if (selectedFilter === 'all') return listItems;
    return listItems.filter((item) => item.category === selectedFilter);
  }, [listItems, selectedFilter]);

  return {
    measurementSets,
    networkError,
    reload,
    loading,
    listItems,
    filteredItems,
  };
}
