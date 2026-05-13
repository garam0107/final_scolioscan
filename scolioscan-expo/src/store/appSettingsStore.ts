import { create } from 'zustand';

import {
  loadCellularDataAllowed,
  loadNightModeSettings,
  saveCellularDataAllowed,
  saveNightModeEnabled,
  saveNightModeHours,
} from '@/src/lib/appSettingsStorage';

type AppSettingsState = {
  cellularDataAllowed: boolean;
  nightModeEnabled: boolean;
  nightStartHour: number;
  nightEndHour: number;
  settingsLoaded: boolean;
  loadSettings: () => Promise<void>;
  setCellularDataAllowed: (allowed: boolean) => Promise<void>;
  setNightModeEnabled: (enabled: boolean) => Promise<void>;
  setNightModeHours: (startHour: number, endHour: number) => Promise<void>;
};

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
  cellularDataAllowed: false,
  nightModeEnabled: false,
  nightStartHour: 22,
  nightEndHour: 6,
  settingsLoaded: false,
  loadSettings: async () => {
    if (get().settingsLoaded) {
      return;
    }

    try {
      const [cellularDataAllowed, nightModeSettings] = await Promise.all([
        loadCellularDataAllowed(),
        loadNightModeSettings(),
      ]);

      set({
        cellularDataAllowed,
        nightModeEnabled: nightModeSettings.enabled,
        nightStartHour: nightModeSettings.startHour,
        nightEndHour: nightModeSettings.endHour,
        settingsLoaded: true,
      });
    } catch (error) {
      // 설정 로딩 실패로 앱 시작이 멈추지 않도록 기본값으로 진행한다.
      set({ settingsLoaded: true });
      throw error;
    }
  },
  setCellularDataAllowed: async (allowed) => {
    const previousValue = get().cellularDataAllowed;

    // 토글 반응은 즉시 보여주고, 저장 실패 시 이전 값으로 되돌린다.
    set({ cellularDataAllowed: allowed });

    try {
      await saveCellularDataAllowed(allowed);
    } catch (error) {
      set({ cellularDataAllowed: previousValue });
      throw error;
    }
  },
  setNightModeEnabled: async (enabled) => {
    const previousValue = get().nightModeEnabled;

    // 토글 반응은 즉시 보여주고, 저장 실패 시 이전 값으로 되돌린다.
    set({ nightModeEnabled: enabled });

    try {
      await saveNightModeEnabled(enabled);
    } catch (error) {
      set({ nightModeEnabled: previousValue });
      throw error;
    }
  },
  setNightModeHours: async (startHour, endHour) => {
    const previousStartHour = get().nightStartHour;
    const previousEndHour = get().nightEndHour;

    // 시간 선택도 즉시 반영하고, 저장 실패 시 이전 시간으로 되돌린다.
    set({
      nightStartHour: startHour,
      nightEndHour: endHour,
    });

    try {
      await saveNightModeHours(startHour, endHour);
    } catch (error) {
      set({
        nightStartHour: previousStartHour,
        nightEndHour: previousEndHour,
      });
      throw error;
    }
  },
}));
