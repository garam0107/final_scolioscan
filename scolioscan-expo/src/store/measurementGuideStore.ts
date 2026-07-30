import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type MeasurementGuidePersistedState = {
  twoDGuideCompleted: boolean;
  scoliometerGuideCompleted: boolean;
};

type MeasurementGuideState = MeasurementGuidePersistedState & {
  activeUserId: string | null;
  twoDGuideSeen: boolean;
  spineGuideSeen: boolean;
  markTwoDGuideSeen: () => void;
  markSpineGuideSeen: () => void;
  completeTwoDGuide: () => void;
  completeScoliometerGuide: () => void;
  resetGuideSeen: () => void;
  resetCurrentUserState: () => void;
  setCurrentUserId: (userId: string) => Promise<void>;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
};

const DEFAULT_GUIDE_STATE: MeasurementGuidePersistedState = {
  twoDGuideCompleted: false,
  scoliometerGuideCompleted: false,
};

function getStorageKey(userId: string) {
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `measurement-guide:${safeUserId}`;
}

function parseStoredGuideState(value: string | null): MeasurementGuidePersistedState {
  if (!value) {
    return DEFAULT_GUIDE_STATE;
  }

  try {
    const parsed = JSON.parse(value) as Partial<MeasurementGuidePersistedState> & {
      measurementGuideCompleted?: boolean;
    };
    // 기존 단일 완료 상태는 두 가이드를 모두 본 상태였으므로 다시 노출하지 않는다.
    const legacyCompleted = parsed.measurementGuideCompleted === true;
    return {
      twoDGuideCompleted: parsed.twoDGuideCompleted === true || legacyCompleted,
      scoliometerGuideCompleted: parsed.scoliometerGuideCompleted === true || legacyCompleted,
    };
  } catch {
    return DEFAULT_GUIDE_STATE;
  }
}

function persistGuideState(userId: string | null, state: MeasurementGuidePersistedState) {
  if (!userId) {
    return;
  }

  // 사용자별 가이드 완료 여부만 저장하고, 화면 안에서 쓰는 임시 체크 상태는 저장하지 않는다.
  void AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(state)).catch((error) => {
    console.log('[measurement-guide] 사용자별 가이드 저장 실패', error);
  });
}

export const useMeasurementGuideStore = create<MeasurementGuideState>()((set, get) => ({
  ...DEFAULT_GUIDE_STATE,
  activeUserId: null,
  twoDGuideSeen: false,
  spineGuideSeen: false,
  hasHydrated: true,
  markTwoDGuideSeen: () => set({ twoDGuideSeen: true }),
  markSpineGuideSeen: () => set({ spineGuideSeen: true }),
  completeTwoDGuide: () => {
    const currentState = get();
    const nextState = {
      twoDGuideCompleted: true,
      scoliometerGuideCompleted: currentState.scoliometerGuideCompleted,
    };
    set(nextState);
    persistGuideState(currentState.activeUserId, nextState);
  },
  completeScoliometerGuide: () => {
    const currentState = get();
    const nextState = {
      twoDGuideCompleted: currentState.twoDGuideCompleted,
      scoliometerGuideCompleted: true,
    };
    set(nextState);
    persistGuideState(currentState.activeUserId, nextState);
  },
  resetGuideSeen: () => set({ twoDGuideSeen: false, spineGuideSeen: false }),
  resetCurrentUserState: () => {
    set({
      ...DEFAULT_GUIDE_STATE,
      activeUserId: null,
      twoDGuideSeen: false,
      spineGuideSeen: false,
      hasHydrated: true,
    });
  },
  setCurrentUserId: async (userId) => {
    set({ hasHydrated: false });
    const storedValue = await AsyncStorage.getItem(getStorageKey(userId));
    set({
      ...parseStoredGuideState(storedValue),
      activeUserId: userId,
      twoDGuideSeen: false,
      spineGuideSeen: false,
      hasHydrated: true,
    });
  },
  setHasHydrated: (hasHydrated) => set({ hasHydrated }),
}));
