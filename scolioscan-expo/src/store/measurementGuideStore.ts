import { create } from 'zustand';

// 가이드 보기 상태 
// 나중에는 영속성으로 저장하도록 바꿔야함.

type MeasurementGuideState = {
  twoDGuideSeen: boolean;
  spineGuideSeen: boolean;
  markTwoDGuideSeen: () => void;
  markSpineGuideSeen: () => void;
  resetGuideSeen: () => void;
};

export const useMeasurementGuideStore = create<MeasurementGuideState>((set) => ({
  twoDGuideSeen: false,
  spineGuideSeen: false,
  markTwoDGuideSeen: () => set({ twoDGuideSeen: true }),
  markSpineGuideSeen: () => set({ spineGuideSeen: true }),
  resetGuideSeen: () => set({ twoDGuideSeen: false, spineGuideSeen: false }),
}));