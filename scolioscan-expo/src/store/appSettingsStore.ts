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
  nightStartMinute: number;
  nightEndHour: number;
  nightEndMinute: number;
  settingsLoaded: boolean;
  loadSettings: () => Promise<void>;
  setCellularDataAllowed: (allowed: boolean) => Promise<void>;
  setNightModeEnabled: (enabled: boolean) => Promise<void>;
  setNightModeHours: (startHour: number, startMinute: number, endHour: number, endMinute: number) => Promise<void>;
  resetSettings: () => Promise<void>;
};

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
  cellularDataAllowed: true,
  nightModeEnabled: false,
  nightStartHour: 22,
  nightStartMinute: 0,
  nightEndHour: 6,
  nightEndMinute: 0,
  settingsLoaded: false,
  loadSettings: async () => {
    if (get().settingsLoaded) {
      return;
    }

    try {
      // 앱 시작 시 필요한 설정을 병렬로 읽어 화면 설정과 네트워크 차단 로직이 같은 값을 보게 한다.
      const [cellularDataAllowed, nightModeSettings] = await Promise.all([
        loadCellularDataAllowed(),
        loadNightModeSettings(),
      ]);

      set({
        cellularDataAllowed,
        nightModeEnabled: nightModeSettings.enabled,
        nightStartHour: nightModeSettings.startHour,
        nightStartMinute: nightModeSettings.startMinute,
        nightEndHour: nightModeSettings.endHour,
        nightEndMinute: nightModeSettings.endMinute,
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
    // API 요청 차단 여부와 설정 스위치가 즉시 맞물리도록 먼저 상태를 바꾼다.

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
  setNightModeHours: async (startHour, startMinute, endHour, endMinute) => {
    const previousStartHour = get().nightStartHour;
    const previousStartMinute = get().nightStartMinute;
    const previousEndHour = get().nightEndHour;
    const previousEndMinute = get().nightEndMinute;

    // 시간 선택도 즉시 반영하고, 저장 실패 시 이전 시간으로 되돌린다.
    set({
      nightStartHour: startHour,
      nightStartMinute: startMinute,
      nightEndHour: endHour,
      nightEndMinute: endMinute,
    });

    try {
      await saveNightModeHours(startHour, startMinute, endHour, endMinute);
    } catch (error) {
      set({
        nightStartHour: previousStartHour,
        nightStartMinute: previousStartMinute,
        nightEndHour: previousEndHour,
        nightEndMinute: previousEndMinute,
      });
      throw error;
    }
  },
  resetSettings: async () => {
  const defaultCellularDataAllowed = true;
  const defaultNightModeEnabled = false;
  const defaultNightStartHour = 22;
  const defaultNightStartMinute = 0;
  const defaultNightEndHour = 6;
  const defaultNightEndMinute = 0;

  set({
    cellularDataAllowed: defaultCellularDataAllowed,
    nightModeEnabled: defaultNightModeEnabled,
    nightStartHour: defaultNightStartHour,
    nightStartMinute: defaultNightStartMinute,
    nightEndHour: defaultNightEndHour,
    nightEndMinute: defaultNightEndMinute,
  });

  await Promise.all([
    saveCellularDataAllowed(defaultCellularDataAllowed),
    saveNightModeEnabled(defaultNightModeEnabled),
    saveNightModeHours(defaultNightStartHour, defaultNightStartMinute, defaultNightEndHour, defaultNightEndMinute),
  ]);
},
}));
