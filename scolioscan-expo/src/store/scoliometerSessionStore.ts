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
  resetSession: () => set({ samples: [] }),
}));
