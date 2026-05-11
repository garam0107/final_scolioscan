import { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';

// 평균 변화량 그래프 UI
import type { CurvatureResponse } from '@/src/types/curvature';
import styles from '@/src/features/report/report.styles';
import {
  aggregateTrendPoints,
  buildTrendPath,
  formatAngleValue,
  formatChangeAngle,
  getMeasurementDate,
  getPeriodOption,
  getRecentDateRangeDates,
  getThresholdY,
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
    if (graphValues.length < 2) return 0;

    let total = 0;
    for (let index = 1; index < graphValues.length; index += 1) {
      total += Math.abs(graphValues[index] - graphValues[index - 1]);
    }

    return Number((total / (graphValues.length - 1)).toFixed(1));
  }, [graphValues]);

  const recentChange = useMemo(() => {
    if (rawValues.length < 2) return 0;

    const last = rawValues[rawValues.length - 1];
    const previous = rawValues[rawValues.length - 2];

    return Number((last - previous).toFixed(1));
  }, [rawValues]);

  const chartPoints = useMemo(() => {
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

    const firstPoint = chartPoints[0];
    const lastPoint = chartPoints[chartPoints.length - 1];

    return `${trendPath} L ${lastPoint.x} ${TREND_CHART_HEIGHT} L ${firstPoint.x} ${TREND_CHART_HEIGHT} Z`;
  }, [chartPoints, trendPath]);

  const xAxisLabels = getTrendAxisLabels(selectedPeriod);
  const hasData = bucketPoints.length > 0;

  return (
    <View style={styles.trendCard}>
      <View style={styles.trendHeader}>
        <View style={styles.trendSummary}>
          <Text style={styles.trendTitle}>평균 변화량</Text>
          <View style={styles.trendValueRow}>
            <Text style={styles.trendValue}>{formatChangeAngle(averageChange)}</Text>
            <View style={styles.trendBadge}>
              <Text style={styles.trendBadgeText}>최근 변화 {formatChangeAngle(recentChange, true)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.trendLegend}>
          <View style={styles.trendLegendRow}>
            <View style={[styles.trendLegendLine, styles.trendLegendDanger]} />
            <Text style={[styles.trendLegendText, styles.trendLegendDangerText]}>위험</Text>
          </View>
          <View style={styles.trendLegendRow}>
            <View style={[styles.trendLegendLine, styles.trendLegendWarning]} />
            <Text style={[styles.trendLegendText, styles.trendLegendWarningText]}>보통</Text>
          </View>
          <View style={styles.trendLegendRow}>
            <View style={[styles.trendLegendLine, styles.trendLegendNormal]} />
            <Text style={[styles.trendLegendText, styles.trendLegendNormalText]}>정상</Text>
          </View>
        </View>
      </View>

      {hasData ? (
        <View style={styles.trendChartWrap}>
          <Svg width={chartWidth} height={TREND_CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="reportTrendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#2E96FF" stopOpacity={0.16} />
                <Stop offset="100%" stopColor="#2E96FF" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Line x1="0" y1={getThresholdY(40)} x2={chartWidth} y2={getThresholdY(40)} stroke="#FF4B3C" strokeWidth={1} strokeDasharray="6 6" />
            <Line x1="0" y1={getThresholdY(25)} x2={chartWidth} y2={getThresholdY(25)} stroke="#FABE00" strokeWidth={1} strokeDasharray="6 6" />
            <Line x1="0" y1={getThresholdY(10)} x2={chartWidth} y2={getThresholdY(10)} stroke="#2C9696" strokeWidth={1} strokeDasharray="6 6" />
            {trendPath ? (
              <>
                <Path d={trendAreaPath} fill="url(#reportTrendAreaGradient)" />
                <Path
                  d={trendPath}
                  fill="none"
                  stroke="#2E96FF"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : null}
          </Svg>
        </View>
      ) : (
        <View style={styles.trendEmptyState}>
          <Text style={styles.trendEmptyText}>선택한 기간의 측정 데이터가 없습니다.</Text>
        </View>
      )}

      <View style={styles.trendXAxis}>
        {xAxisLabels.map((label) => (
          <Text key={label} style={styles.trendXAxisText}>{label}</Text>
        ))}
      </View>
    </View>
  );
}
