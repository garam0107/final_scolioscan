import { formatDateParam } from '@/src/features/report/reportTrend';

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

export function getMonthSelectionYears(date: Date) {
  const currentYear = date.getFullYear();
  return Array.from({ length: 4 }, (_, index) => currentYear - 3 + index);
}

export function isFutureMonth(year: number, month: number, currentDate: Date) {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  return year > currentYear || (year === currentYear && month > currentMonth);
}

export function getMonthDateRange(year: number, month: number) {
  const fromDate = new Date(year, month - 1, 1);
  const toDate = new Date(year, month, 0);

  return {
    from_date: formatDateParam(fromDate),
    to_date: formatDateParam(toDate),
  };
}
