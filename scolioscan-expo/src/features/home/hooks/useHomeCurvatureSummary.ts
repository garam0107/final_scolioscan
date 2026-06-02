import { useCallback, useMemo, useState } from 'react';
import { curvatureAPI } from '@/src/api/curvature';
import {
  CURVATURE_TREND_CHART_HEIGHT,
  CURVATURE_TREND_CHART_MAX_VALUE,
  type CurvatureSummaryItem,
} from '@/src/features/measurementSummary/measurementSummaryTypes';
import { isNetworkError } from '@/src/lib/apiError';
import type { CurvatureResponse } from '@/src/types/curvature';
import {
  buildTrendPath,
  filterRecentCurvatureRecords,
  formatAngleValue,
  formatChangeAngle,
  getDailyLatestCurvatureRecords,
  getMeasurementDate,
  getRecentDateRange,
  getRecentDateRangeDates,
  getSelectedCurvatureValue,
  INITIAL_WEEKLY_RESULT_VALUES,
  RECENT_CURVATURE_DAYS,
  type WeeklyResultId,
  type WeeklyResultValues,
} from '@/src/features/home/utils/homeCurvatureUtils';

export function useHomeCurvatureSummary(
  trendChartWidth: number,
  setNetworkError: (value: boolean) => void,
) {
  const [selectedWeeklyResultId, setSelectedWeeklyResultId] = useState<WeeklyResultId>('upper-thoracic');
  const [weeklyResultValues, setWeeklyResultValues] = useState<WeeklyResultValues>(INITIAL_WEEKLY_RESULT_VALUES);
  const [curvatureTrendRecords, setCurvatureTrendRecords] = useState<CurvatureResponse[]>([]);
  const [rawCurvatureTrendRecords, setRawCurvatureTrendRecords] = useState<CurvatureResponse[]>([]);

  const weeklyResults: CurvatureSummaryItem<WeeklyResultId>[] = [
    { key: 'upper-thoracic', label: '상부 흉추만곡', value: `${weeklyResultValues.upperThoracic}°` },
    { key: 'main-thoracic', label: '주 흉추만곡', value: `${weeklyResultValues.mainThoracic}°` },
    { key: 'lumbar', label: '요추만곡', value: `${weeklyResultValues.lumbar}°` },
  ];

  const trendRecords = useMemo(
    () => [...curvatureTrendRecords].reverse(),
    [curvatureTrendRecords],
  );

  const trendValues = useMemo(
    () => trendRecords.map((record) => formatAngleValue(getSelectedCurvatureValue(record, selectedWeeklyResultId))),
    [selectedWeeklyResultId, trendRecords],
  );

  const rawTrendRecords = useMemo(
    () =>
      [...rawCurvatureTrendRecords].sort(
        (left, right) =>
          new Date(getMeasurementDate(left)).getTime() - new Date(getMeasurementDate(right)).getTime(),
      ),
    [rawCurvatureTrendRecords],
  );

  const rawTrendValues = useMemo(
    () => rawTrendRecords.map((record) => formatAngleValue(getSelectedCurvatureValue(record, selectedWeeklyResultId))),
    [rawTrendRecords, selectedWeeklyResultId],
  );

  const trendPeriodRange = useMemo(
    () => getRecentDateRangeDates(RECENT_CURVATURE_DAYS),
    [],
  );

  const trendPoints = useMemo(() => {
    // 최근 30일 범위 안에서 측정 시각은 x좌표, 만곡 각도는 y좌표로 변환한다.
    const startTime = trendPeriodRange.startDate.getTime();
    const endTime = trendPeriodRange.endDate.getTime();
    const rangeTime = Math.max(1, endTime - startTime);

    return trendRecords.map((record) => {
      const measurementTime = new Date(getMeasurementDate(record)).getTime();
      const clampedTime = Math.max(startTime, Math.min(endTime, measurementTime));
      const value = formatAngleValue(getSelectedCurvatureValue(record, selectedWeeklyResultId));
      const safeValue = Math.max(0, Math.min(value, CURVATURE_TREND_CHART_MAX_VALUE));

      return {
        x: ((clampedTime - startTime) / rangeTime) * trendChartWidth,
        y: CURVATURE_TREND_CHART_HEIGHT
          - (safeValue / CURVATURE_TREND_CHART_MAX_VALUE) * CURVATURE_TREND_CHART_HEIGHT,
      };
    });
  }, [selectedWeeklyResultId, trendChartWidth, trendPeriodRange, trendRecords]);

  const trendPath = useMemo(
    () => buildTrendPath(trendPoints),
    [trendPoints],
  );

  const trendAreaPath = useMemo(() => {
    if (!trendPath || trendPoints.length === 0) {
      return '';
    }

    // 추세선 아래쪽을 닫힌 path로 만들어 그래프 면적 그라데이션을 채운다.
    const firstPoint = trendPoints[0];
    const lastPoint = trendPoints[trendPoints.length - 1];

    return `${trendPath} L ${lastPoint.x} ${CURVATURE_TREND_CHART_HEIGHT} L ${firstPoint.x} ${CURVATURE_TREND_CHART_HEIGHT} Z`;
  }, [trendPath, trendPoints]);

  const recentChange = useMemo(() => {
    // 최근 변화량은 원본 최신 두 측정값의 차이를 사용해 하루 대표값 집계 영향을 줄인다.
    if (rawTrendValues.length < 2) {
      return 0;
    }

    const latestTrendValue = rawTrendValues[rawTrendValues.length - 1];
    const previousTrendValue = rawTrendValues[rawTrendValues.length - 2];

    return Number((latestTrendValue - previousTrendValue).toFixed(1));
  }, [rawTrendValues]);

  const averageChange = useMemo(() => {
    // 평균 변화량은 인접 측정값 사이의 절대 변화 폭을 평균낸 값이다.
    const values = trendValues.length >= 2 ? trendValues : rawTrendValues;

    if (values.length < 2) {
      return 0;
    }

    const totalChange = values.slice(1).reduce((sum, value, index) => {
      return sum + Math.abs(value - values[index]);
    }, 0);

    return Number((totalChange / (values.length - 1)).toFixed(1));
  }, [rawTrendValues, trendValues]);

  const loadLatestCurvature = useCallback(async () => {
    try {
      // 네트워크가 복구된 뒤 재시도할 때 오류 화면을 내리고 최신 홈 데이터를 다시 채웁니다.
      setNetworkError(false);
      // 최근 측정값과 원본 기록을 함께 보관해 카드, 변화량, 차트가 같은 응답을 기준으로 갱신되게 한다.
      const response = await curvatureAPI.getAnalyses({
        limit: 1000,
        ...getRecentDateRange(RECENT_CURVATURE_DAYS),
      });
      const recentCurvatures = filterRecentCurvatureRecords(response.data);
      const dailyLatestCurvatures = getDailyLatestCurvatureRecords(recentCurvatures);
      const latestCurvature = dailyLatestCurvatures[0];
      setRawCurvatureTrendRecords(recentCurvatures);
      setCurvatureTrendRecords(dailyLatestCurvatures);

      if (!latestCurvature) {
        setWeeklyResultValues(INITIAL_WEEKLY_RESULT_VALUES);
        setRawCurvatureTrendRecords([]);
        return;
      }

      setWeeklyResultValues({
        upperThoracic: formatAngleValue(latestCurvature.secondary_thoracic_cobb),
        mainThoracic: formatAngleValue(latestCurvature.main_thoracic_cobb),
        lumbar: formatAngleValue(latestCurvature.lumbar_cobb),
      });
    } catch (error) {
      if (isNetworkError(error)) {
        setNetworkError(true);
      }

      setWeeklyResultValues(INITIAL_WEEKLY_RESULT_VALUES);
      setRawCurvatureTrendRecords([]);
      setCurvatureTrendRecords([]);
    }
  }, [setNetworkError]);

  return {
    selectedWeeklyResultId,
    setSelectedWeeklyResultId,
    weeklyResults,
    averageChangeText: formatChangeAngle(averageChange),
    recentChangeText: formatChangeAngle(recentChange, true),
    trendPath,
    trendAreaPath,
    loadLatestCurvature,
  };
}
