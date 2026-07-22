import { i18n } from '@/src/i18n';
import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

// 평균 변화량 그래프 UI
import type { CurvatureResponse } from '@/src/types/curvature';
import CurvatureTrendChart from '@/src/features/measurementSummary/components/CurvatureTrendChart';
import {
  aggregateTrendPoints,
  buildTrendPath,
  formatAngleValue,
  formatChangeAngle,
  getMeasurementDate,
  getPeriodOption,
  getRecentDateRangeDates,
  getTrendAxisLabels,
  getTrendValue,
  TREND_CHART_HEIGHT,
  TREND_CHART_MAX_VALUE,
  type TrendAngleKey,
  type TrendPeriodKey,
} from '@/src/features/report/reportTrend';

type ReportTrendChartProps = {
  records: CurvatureResponse[];
  selectedAngle: TrendAngleKey;
  selectedPeriod: TrendPeriodKey;
};

export default function ReportTrendChart({
  records,
  selectedAngle,
  selectedPeriod,
}: ReportTrendChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(1, width - 72);

  const sortedRecords = useMemo(
    // 차트 계산은 시간 흐름 기준이므로 오래된 측정부터 정렬한다.
    () =>
      [...records].sort(
        (left, right) =>
          new Date(getMeasurementDate(left)).getTime() - new Date(getMeasurementDate(right)).getTime(),
      ),
    [records],
  );

  const periodRange = useMemo(
    () => getRecentDateRangeDates(getPeriodOption(selectedPeriod).days),
    [selectedPeriod],
  );

  const periodRecords = useMemo(() => {
    // 선택한 기간 밖의 측정값은 변화량과 그래프 계산에서 제외한다.
    if (!sortedRecords.length) return [];

    return sortedRecords.filter((record) => {
      const measurementDate = new Date(getMeasurementDate(record));
      return measurementDate >= periodRange.startDate && measurementDate <= periodRange.endDate;
    });
  }, [periodRange, sortedRecords]);

  const bucketPoints = useMemo(
    () => aggregateTrendPoints(periodRecords, selectedAngle, selectedPeriod),
    [periodRecords, selectedAngle, selectedPeriod],
  );

  const graphValues = useMemo(
    () => bucketPoints.map((point) => point.value),
    [bucketPoints],
  );

  const rawValues = useMemo(
    () => periodRecords.map((record) => formatAngleValue(getTrendValue(record, selectedAngle))),
    [periodRecords, selectedAngle],
  );

  const averageChange = useMemo(() => {
    // 그래프에 표시된 대표값 사이의 평균 변화 폭을 계산한다.
    if (graphValues.length < 2) return 0;

    let total = 0;
    for (let index = 1; index < graphValues.length; index += 1) {
      total += Math.abs(graphValues[index] - graphValues[index - 1]);
    }

    return Number((total / (graphValues.length - 1)).toFixed(1));
  }, [graphValues]);

  const recentChange = useMemo(() => {
    // 최근 변화량은 묶은 값이 아니라 실제 최신 두 측정값으로 계산한다.
    if (rawValues.length < 2) return 0;

    const last = rawValues[rawValues.length - 1];
    const previous = rawValues[rawValues.length - 2];

    return Number((last - previous).toFixed(1));
  }, [rawValues]);

  const chartPoints = useMemo(() => {
    // 시간과 각도 값을 SVG 좌표계 안으로 변환한다.
    const rangeTime = Math.max(1, periodRange.endDate.getTime() - periodRange.startDate.getTime());

    return bucketPoints.map((point) => {
      const clampedTime = Math.max(
        periodRange.startDate.getTime(),
        Math.min(periodRange.endDate.getTime(), point.timestamp),
      );
      const safeValue = Math.max(0, Math.min(point.value, TREND_CHART_MAX_VALUE));

      return {
        x: ((clampedTime - periodRange.startDate.getTime()) / rangeTime) * chartWidth,
        y: TREND_CHART_HEIGHT - (safeValue / TREND_CHART_MAX_VALUE) * TREND_CHART_HEIGHT,
      };
    });
  }, [bucketPoints, chartWidth, periodRange]);

  const trendPath = useMemo(
    () => buildTrendPath(chartPoints),
    [chartPoints],
  );

  const trendAreaPath = useMemo(() => {
    if (!trendPath || chartPoints.length === 0) return '';

    // 선 그래프 아래 영역을 닫아 SVG fill 그라데이션으로 채울 수 있게 한다.
    const firstPoint = chartPoints[0];
    const lastPoint = chartPoints[chartPoints.length - 1];

    return `${trendPath} L ${lastPoint.x} ${TREND_CHART_HEIGHT} L ${firstPoint.x} ${TREND_CHART_HEIGHT} Z`;
  }, [chartPoints, trendPath]);

  const xAxisLabels = getTrendAxisLabels(selectedPeriod);
  const hasData = bucketPoints.length > 0;

  return (
    <CurvatureTrendChart
      chartWidth={chartWidth}
      averageChangeText={formatChangeAngle(averageChange)}
      recentChangeText={formatChangeAngle(recentChange, true)}
      trendPath={trendPath}
      trendAreaPath={trendAreaPath}
      xAxisLabels={xAxisLabels}
      gradientId="reportTrendAreaGradient"
      hasData={hasData}
      emptyText={i18n.t("선택한 기간의 측정 데이터가 없습니다.")}
    />
  );
}
