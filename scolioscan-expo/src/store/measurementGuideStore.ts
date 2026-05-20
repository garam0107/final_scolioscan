import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
// 가이드 보기 상태 

/*
measurementGuideCompleted는 AsyncStorage에 저장되는 최종 완료 상태
true가 되면 홈에서 측정하기 누르면 가이드 인트로 건너뛰기

twoDGuideSeen, spineGuideSeen은 인트로 화면 안에서만 사용하는 임시 체크 상태
사용자가 두 가이드를 모두 본 뒤 측정하기를 누르면 measurementGuideCompleted를 true로 저장


clearMeasurementGuideCompleted는 임시로 store 지우는 것이기 때문에 나중에 삭제 

hasHtdrated는 홈에서 store 복원 완료 알려주는 상태
*/
type MeasurementGuideState = {
  measurementGuideCompleted: boolean;
  twoDGuideSeen: boolean;
  spineGuideSeen: boolean;
  markTwoDGuideSeen: () => void;
  markSpineGuideSeen: () => void;
  completeMeasurementGuide: () => void;
  clearMeasurementGuideCompleted: () => void;
  resetGuideSeen: () => void;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
};
// clearMeasurementGuideCompleted는 테스트 용이니까 나중에 삭제 
export const useMeasurementGuideStore = create<MeasurementGuideState>()(
  persist(
    (set) => ({
      measurementGuideCompleted: false,
      twoDGuideSeen: false,
      spineGuideSeen: false,
      hasHydrated : false,
      markTwoDGuideSeen: () => set({ twoDGuideSeen: true }),
      markSpineGuideSeen: () => set({ spineGuideSeen: true }),
      completeMeasurementGuide: () => set({ measurementGuideCompleted: true }),
      resetGuideSeen: () => set({ twoDGuideSeen: false, spineGuideSeen: false }),
      clearMeasurementGuideCompleted: () =>  
        set({
          measurementGuideCompleted: false,
          twoDGuideSeen: false,
          spineGuideSeen: false,
        }),
        setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'measurement-guide',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        measurementGuideCompleted: state.measurementGuideCompleted,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);