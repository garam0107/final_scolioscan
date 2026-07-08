import { create } from 'zustand';

export const SCOLIOMETER_REQUIRED_SAMPLE_COUNT = 5;

export type ScoliometerSample = {
  angle: number;
  measuredAt: number;
};

type ScoliometerSessionState = {
  samples: ScoliometerSample[];
  addSample: (angle: number) => void;
  resetSession: () => void;
};

export const useScoliometerSessionStore = create<ScoliometerSessionState>((set) => ({
  samples: [],
  addSample: (angle) =>
    // 스콜리오미터는 필요한 개수까지만 샘플을 쌓아 다음 분석 단계에서 사용한다.
    set((state) => ({
      samples:
        state.samples.length >= SCOLIOMETER_REQUIRED_SAMPLE_COUNT
          ? state.samples
          : [
              ...state.samples,
              {
                angle,
                measuredAt: Date.now(),
              },
            ],
    })),
  // 새 측정을 시작할 때 이전 각도 샘플과 연결 아이디를 모두 비운다.
  resetSession: () => set({ samples: [] }),
}));
