import { create } from 'zustand';

export const SCOLIOMETER_REQUIRED_SAMPLE_COUNT = 5;

export type ScoliometerSample = {
  angle: number;
  measuredAt: number;
};

type ScoliometerSessionState = {
  samples: ScoliometerSample[];
  curvatureMeasurementId: number | null;
  addSample: (angle: number) => void;
  setCurvatureMeasurementId: (curvatureMeasurementId: number | null) => void;
  resetSession: () => void;
};

export const useScoliometerSessionStore = create<ScoliometerSessionState>((set) => ({
  samples: [],
  curvatureMeasurementId: null,
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
  setCurvatureMeasurementId: (curvatureMeasurementId) => set({ curvatureMeasurementId }),
  resetSession: () => set({ samples: [], curvatureMeasurementId: null }),
}));
