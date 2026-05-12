import type { CurvatureResponse } from '@/src/types/curvature';
import type { RotationResponse } from '@/src/types/rotation';


// 평균 변화량 그래프 계산
export type TrendAngleKey = 'proximal' | 'main' | 'lumbar';
export type TrendPeriodKey = 'week1' | 'week2' | 'month1' | 'month3' | 'month6' | 'year1';

export type TrendChartPoint = {
  x: number;
  y: number;
};

type TrendBucketPoint = {
  timestamp: number;
  value: number;
};

export const TREND_ANGLE_OPTIONS: {
  key: TrendAngleKey;
  label: string;
  displayLabel: string;
  field: keyof Pick<
    CurvatureResponse,
    'secondary_thoracic_cobb' | 'main_thoracic_cobb' | 'lumbar_cobb'
  >;
}[] = [
  {
    key: 'proximal',
    label: '상부 흉추',
    displayLabel: '상부 흉추만곡',
    field: 'secondary_thoracic_cobb',
  },
  {
    key: 'main',
    label: '주 흉추',
    displayLabel: '주 흉추만곡',
    field: 'main_thoracic_cobb',
  },
  {
    key: 'lumbar',
    label: '요추',
    displayLabel: '요추만곡',
    field: 'lumbar_cobb',
  },
];

export const TREND_PERIOD_OPTIONS: { key: TrendPeriodKey; label: string; days: number }[] = [
  { key: 'week1', label: '1주일', days: 7 },
  { key: 'week2', label: '2주일', days: 14 },
  { key: 'month1', label: '1개월', days: 30 },
  { key: 'month3', label: '3개월', days: 90 },
  { key: 'month6', label: '6개월', days: 180 },
  { key: 'year1', label: '1년', days: 365 },
];

export const REPORT_CURVATURE_DAYS = 365;
export const TREND_CHART_HEIGHT = 120;
export const TREND_CHART_MAX_VALUE = 40;

export function getMeasurementDate(
  record: Pick<CurvatureResponse, 'measured_at' | 'created_at'> | Pick<RotationResponse, 'measured_at' | 'created_at'>,
) {
  return record.measured_at || record.created_at;
}

export function getTrendValue(record: CurvatureResponse | undefined, key: TrendAngleKey) {
  const option = TREND_ANGLE_OPTIONS.find((item) => item.key === key) ?? TREND_ANGLE_OPTIONS[1];
  return Math.abs(Number(record?.[option.field]) || 0);
}

export function formatAngleValue(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 10) / 10;
}

export function formatChangeAngle(value: number, showPlus = false) {
  const angle = formatAngleValue(Math.abs(value));
  const sign = showPlus
    ? value > 0
      ? '+'
      : value < 0
        ? '-'
        : ''
    : '';

  return `${sign}${angle}°`;
}

export function getPeriodOption(period: TrendPeriodKey) {
  return TREND_PERIOD_OPTIONS.find((item) => item.key === period) ?? TREND_PERIOD_OPTIONS[2];
}

export function formatDateParam(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getRecentDateRange(days: number) {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - (days - 1));

  return {
    from_date: formatDateParam(fromDate),
    to_date: formatDateParam(toDate),
  };
}

export function getRecentDateRangeDates(days: number) {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate };
}

export function buildTrendPath(points: TrendChartPoint[]) {
  if (points.length === 0) {
    return '';
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y}`;
  }

  const path = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const previous = points[index - 1] ?? current;
    const afterNext = points[index + 2] ?? next;

    const cp1x = current.x + (next.x - previous.x) / 6;
    const cp1y = current.y + (next.y - previous.y) / 6;
    const cp2x = next.x - (afterNext.x - current.x) / 6;
    const cp2y = next.y - (afterNext.y - current.y) / 6;

    path.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${next.x} ${next.y}`);
  }

  return path.join(' ');
}

function getBucketResolution(period: TrendPeriodKey) {
  if (period === 'week1') return 'raw';
  if (period === 'week2' || period === 'month1') return 'daily';
  if (period === 'month3') return 'weekly';
  if (period === 'month6') return 'biweekly';
  return 'monthly';
}

function getBucketKey(date: Date, period: TrendPeriodKey) {
  const resolution = getBucketResolution(period);

  if (resolution === 'raw') {
    return `${date.getTime()}`;
  }

  if (resolution === 'daily') {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  if (resolution === 'weekly' || resolution === 'biweekly') {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayIndex = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
    const bucketSize = resolution === 'weekly' ? 7 : 14;
    const bucketIndex = Math.floor(dayIndex / bucketSize);

    return `${date.getFullYear()}-${resolution}-${bucketIndex}`;
  }

  return `${date.getFullYear()}-${date.getMonth()}`;
}

export function aggregateTrendPoints(
  records: CurvatureResponse[],
  selectedAngle: TrendAngleKey,
  selectedPeriod: TrendPeriodKey,
) {
  const resolution = getBucketResolution(selectedPeriod);

  if (resolution === 'raw') {
    return records.map((record) => ({
      timestamp: new Date(getMeasurementDate(record)).getTime(),
      value: formatAngleValue(getTrendValue(record, selectedAngle)),
    }));
  }

  const buckets = new Map<string, {
    latestTimestamp: number;
    latestValue: number;
    totalValue: number;
    count: number;
  }>();

  records.forEach((record) => {
    const measurementDate = new Date(getMeasurementDate(record));
    const timestamp = measurementDate.getTime();
    const value = formatAngleValue(getTrendValue(record, selectedAngle));
    const bucketKey = getBucketKey(measurementDate, selectedPeriod);
    const current = buckets.get(bucketKey);

    if (!current) {
      buckets.set(bucketKey, {
        latestTimestamp: timestamp,
        latestValue: value,
        totalValue: value,
        count: 1,
      });
      return;
    }

    current.totalValue += value;
    current.count += 1;

    if (timestamp >= current.latestTimestamp) {
      current.latestTimestamp = timestamp;
      current.latestValue = value;
    }
  });

  return Array.from(buckets.values())
    .map<TrendBucketPoint>((bucket) => ({
      timestamp: bucket.latestTimestamp,
      value: resolution === 'daily'
        ? bucket.latestValue
        : formatAngleValue(bucket.totalValue / bucket.count),
    }))
    .sort((left, right) => left.timestamp - right.timestamp);
}

export function getThresholdY(value: number) {
  return TREND_CHART_HEIGHT - (value / TREND_CHART_MAX_VALUE) * TREND_CHART_HEIGHT;
}

export function getTrendAxisLabels(period: TrendPeriodKey) {
  if (period === 'week1') return ['6일 전', '4일 전', '2일 전', '어제', '오늘'];
  if (period === 'week2') return ['2주 전', '10일 전', '1주 전', '3일 전', '오늘'];
  if (period === 'year1') return ['1년 전', '9개월 전', '6개월 전', '3개월 전', '오늘'];

  const monthLabels: Record<TrendPeriodKey, string[]> = {
    week1: [],
    week2: [],
    month1: ['한 달 전', '3주 전', '2주 전', '1주 전', '오늘'],
    month3: ['3개월 전', '2개월 전', '1개월 전', '2주 전', '오늘'],
    month6: ['6개월 전', '4개월 전', '2개월 전', '1개월 전', '오늘'],
    year1: [],
  };

  return monthLabels[period];
}
