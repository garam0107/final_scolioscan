import type { CurvatureResponse } from '@/src/types/curvature';

export type WeeklyResultId = 'upper-thoracic' | 'main-thoracic' | 'lumbar';

export type WeeklyResultValues = {
  upperThoracic: number;
  mainThoracic: number;
  lumbar: number;
};

export type TrendChartPoint = {
  x: number;
  y: number;
};

export const RECENT_CURVATURE_DAYS = 30;

export const INITIAL_WEEKLY_RESULT_VALUES: WeeklyResultValues = {
  upperThoracic: 0,
  mainThoracic: 0,
  lumbar: 0,
};

export function formatAngleValue(value: number) {
  // 서버 값이 비정상이어도 홈 카드와 차트 계산이 깨지지 않게 보정한다.
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

export function getSelectedCurvatureValue(record: CurvatureResponse, selectedId: WeeklyResultId) {
  // 화면 카드의 선택값을 서버 응답의 실제 만곡 필드와 연결한다.
  if (selectedId === 'upper-thoracic') {
    return record.secondary_thoracic_cobb;
  }

  if (selectedId === 'main-thoracic') {
    return record.main_thoracic_cobb;
  }

  return record.lumbar_cobb;
}

export function getMeasurementDate(record: Pick<CurvatureResponse, 'measured_at' | 'created_at'>) {
  return record.measured_at || record.created_at;
}

function formatDateParam(date: Date) {
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

export function filterRecentCurvatureRecords(records: CurvatureResponse[]) {
  // 홈 추세는 최근 30일만 보여주므로 범위 밖 측정값은 제외한다.
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (RECENT_CURVATURE_DAYS - 1));
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return records.filter((record) => {
    const measurementDate = new Date(getMeasurementDate(record));
    return measurementDate >= startDate && measurementDate <= endDate;
  });
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function getDailyLatestCurvatureRecords(records: CurvatureResponse[]) {
  // 같은 날 여러 번 측정한 경우 가장 최신 측정만 하루 대표값으로 사용한다.
  const latestByDay = new Map<string, CurvatureResponse>();

  records.forEach((record) => {
    const measurementDate = new Date(getMeasurementDate(record));
    const dateKey = getDateKey(measurementDate);
    const current = latestByDay.get(dateKey);

    if (!current) {
      latestByDay.set(dateKey, record);
      return;
    }

    const currentTime = new Date(getMeasurementDate(current)).getTime();
    if (measurementDate.getTime() >= currentTime) {
      latestByDay.set(dateKey, record);
    }
  });

  return Array.from(latestByDay.values()).sort(
    (left, right) => new Date(getMeasurementDate(right)).getTime() - new Date(getMeasurementDate(left)).getTime(),
  );
}

export function buildTrendPath(points: TrendChartPoint[]) {
  // 측정점 사이를 부드러운 곡선으로 이어 홈 추세 그래프를 만든다.
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
