import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// 리포트 측정 목록 날짜 선택 상태

export type ReportMeasurementListMonthMode = 'all' | 'specific';

type ReportMeasurementListFilterState = {
  monthMode: ReportMeasurementListMonthMode;
  selectedYear: number;
  selectedMonth: number;
  setMonthMode: (monthMode: ReportMeasurementListMonthMode) => void;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
};

const initialDate = new Date();

export const useReportMeasurementListFilterStore = create<ReportMeasurementListFilterState>()(
  persist(
    (set) => ({
      monthMode: 'all',
      selectedYear: initialDate.getFullYear(),
      selectedMonth: initialDate.getMonth() + 1,
      setMonthMode: (monthMode) => set({ monthMode }),
      setSelectedYear: (selectedYear) => set({ selectedYear }),
      setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
    }),
    {
      name: 'report-measurement-list-filter',
      storage: createJSONStorage(() => AsyncStorage),
      // 함수는 저장하지 않고 월 선택 값만 앱 재실행 후 복원한다.
      partialize: (state) => ({
        monthMode: state.monthMode,
        selectedYear: state.selectedYear,
        selectedMonth: state.selectedMonth,
      }),
    },
  ),
);
