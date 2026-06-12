import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type ReportMeasurementListMonthMode = 'all' | 'specific';

type ReportMeasurementListFilterValues = {
  monthMode: ReportMeasurementListMonthMode;
  selectedYear: number;
  selectedMonth: number;
};

type ReportMeasurementListFilterState = ReportMeasurementListFilterValues & {
  activeUserId: string | null;
  setCurrentUserId: (userId: string) => Promise<void>;
  resetCurrentUserState: () => void;
  setMonthMode: (monthMode: ReportMeasurementListMonthMode) => void;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
};

const initialDate = new Date();

const DEFAULT_FILTER: ReportMeasurementListFilterValues = {
  monthMode: 'all',
  selectedYear: initialDate.getFullYear(),
  selectedMonth: initialDate.getMonth() + 1,
};

function getStorageKey(userId: string) {
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `report-measurement-list-filter:${safeUserId}`;
}

function parseStoredFilter(value: string | null): ReportMeasurementListFilterValues {
  if (!value) {
    return DEFAULT_FILTER;
  }

  try {
    const parsed = JSON.parse(value) as Partial<ReportMeasurementListFilterValues>;
    const monthMode = parsed.monthMode === 'specific' ? 'specific' : 'all';
    const parsedYear = parsed.selectedYear;
    const parsedMonth = parsed.selectedMonth;
    const selectedYear =
      typeof parsedYear === 'number' && Number.isInteger(parsedYear) ? parsedYear : DEFAULT_FILTER.selectedYear;
    const selectedMonth =
      typeof parsedMonth === 'number' && Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
        ? parsedMonth
        : DEFAULT_FILTER.selectedMonth;

    return { monthMode, selectedYear, selectedMonth };
  } catch {
    return DEFAULT_FILTER;
  }
}

function persistFilter(userId: string | null, filter: ReportMeasurementListFilterValues) {
  if (!userId) {
    return;
  }

  // 화면 반응을 막지 않기 위해 저장 실패는 콘솔에만 남긴다.
  void AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(filter)).catch((error) => {
    console.log('[report-filter] 사용자별 필터 저장 실패', error);
  });
}

export const useReportMeasurementListFilterStore = create<ReportMeasurementListFilterState>()((set, get) => ({
  ...DEFAULT_FILTER,
  activeUserId: null,
  setCurrentUserId: async (userId) => {
    const storedValue = await AsyncStorage.getItem(getStorageKey(userId));
    set({
      ...parseStoredFilter(storedValue),
      activeUserId: userId,
    });
  },
  resetCurrentUserState: () => {
    set({
      ...DEFAULT_FILTER,
      activeUserId: null,
    });
  },
  setMonthMode: (monthMode) => {
    const nextFilter = { ...get(), monthMode };
    set({ monthMode });
    persistFilter(get().activeUserId, {
      monthMode: nextFilter.monthMode,
      selectedYear: nextFilter.selectedYear,
      selectedMonth: nextFilter.selectedMonth,
    });
  },
  setSelectedYear: (selectedYear) => {
    const nextFilter = { ...get(), selectedYear };
    set({ selectedYear });
    persistFilter(get().activeUserId, {
      monthMode: nextFilter.monthMode,
      selectedYear: nextFilter.selectedYear,
      selectedMonth: nextFilter.selectedMonth,
    });
  },
  setSelectedMonth: (selectedMonth) => {
    const nextFilter = { ...get(), selectedMonth };
    set({ selectedMonth });
    persistFilter(get().activeUserId, {
      monthMode: nextFilter.monthMode,
      selectedYear: nextFilter.selectedYear,
      selectedMonth: nextFilter.selectedMonth,
    });
  },
}));
