import { create } from 'zustand';

type MeasurementRefreshState = {
  version: number;
  markMeasurementChanged: () => void;
};

export const useMeasurementRefreshStore = create<MeasurementRefreshState>((set) => ({
  version: 0,
  markMeasurementChanged: () =>
    set((state) => ({
      // 측정 저장이 끝났다는 신호만 남기고, 실제 최신 데이터는 각 화면의 기존 API 로직이 다시 불러온다.
      version: state.version + 1,
    })),
}));
