import { create } from 'zustand';

import {
  loadCellularDataAllowed,
  loadNightModeSettings,
  saveCellularDataAllowed,
  saveNightModeEnabled,
  saveNightModeHours,
} from '@/src/lib/appSettingsStorage';

const DEFAULT_SETTINGS = {
  cellularDataAllowed: true,
  nightModeEnabled: false,
  nightStartHour: 22,
  nightStartMinute: 0,
  nightEndHour: 6,
  nightEndMinute: 0,
};

type AppSettingsState = typeof DEFAULT_SETTINGS & {
  activeUserId: string | null;
  loadedForUserId: string | null;
  settingsLoaded: boolean;
  loadSettings: (userId: string) => Promise<void>;
  resetSettingsState: () => void;
  setCellularDataAllowed: (allowed: boolean) => Promise<void>;
  setNightModeEnabled: (enabled: boolean) => Promise<void>;
  setNightModeHours: (startHour: number, startMinute: number, endHour: number, endMinute: number) => Promise<void>;
  resetSettings: () => Promise<void>;
};

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  activeUserId: null,
  loadedForUserId: null,
  settingsLoaded: true,
  loadSettings: async (userId) => {
    if (get().loadedForUserId === userId && get().settingsLoaded) {
      return;
    }

    set({ settingsLoaded: false, activeUserId: userId });

    try {
      // 로그인한 사용자 id 기준으로 로컬 설정을 읽어 계정 간 설정 섞임을 막는다.
      const [cellularDataAllowed, nightModeSettings] = await Promise.all([
        loadCellularDataAllowed(userId),
        loadNightModeSettings(userId),
      ]);

      set({
        cellularDataAllowed,
        nightModeEnabled: nightModeSettings.enabled,
        nightStartHour: nightModeSettings.startHour,
        nightStartMinute: nightModeSettings.startMinute,
        nightEndHour: nightModeSettings.endHour,
        nightEndMinute: nightModeSettings.endMinute,
        activeUserId: userId,
        loadedForUserId: userId,
        settingsLoaded: true,
      });
    } catch (error) {
      set({
        ...DEFAULT_SETTINGS,
        activeUserId: userId,
        loadedForUserId: userId,
        settingsLoaded: true,
      });
      throw error;
    }
  },
  resetSettingsState: () => {
    // 로그아웃 후에는 이전 사용자의 메모리 설정이 화면에 남지 않도록 기본값으로만 되돌린다.
    set({
      ...DEFAULT_SETTINGS,
      activeUserId: null,
      loadedForUserId: null,
      settingsLoaded: true,
    });
  },
  setCellularDataAllowed: async (allowed) => {
    const userId = get().activeUserId;
    const previousValue = get().cellularDataAllowed;

    set({ cellularDataAllowed: allowed });

    if (!userId) {
      return;
    }

    try {
      await saveCellularDataAllowed(userId, allowed);
    } catch (error) {
      set({ cellularDataAllowed: previousValue });
      throw error;
    }
  },
  setNightModeEnabled: async (enabled) => {
    const userId = get().activeUserId;
    const previousValue = get().nightModeEnabled;

    set({ nightModeEnabled: enabled });

    if (!userId) {
      return;
    }

    try {
      await saveNightModeEnabled(userId, enabled);
    } catch (error) {
      set({ nightModeEnabled: previousValue });
      throw error;
    }
  },
  setNightModeHours: async (startHour, startMinute, endHour, endMinute) => {
    const userId = get().activeUserId;
    const previousStartHour = get().nightStartHour;
    const previousStartMinute = get().nightStartMinute;
    const previousEndHour = get().nightEndHour;
    const previousEndMinute = get().nightEndMinute;

    set({
      nightStartHour: startHour,
      nightStartMinute: startMinute,
      nightEndHour: endHour,
      nightEndMinute: endMinute,
    });

    if (!userId) {
      return;
    }

    try {
      await saveNightModeHours(userId, startHour, startMinute, endHour, endMinute);
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
    const userId = get().activeUserId;

    set(DEFAULT_SETTINGS);

    if (!userId) {
      return;
    }

    await Promise.all([
      saveCellularDataAllowed(userId, DEFAULT_SETTINGS.cellularDataAllowed),
      saveNightModeEnabled(userId, DEFAULT_SETTINGS.nightModeEnabled),
      saveNightModeHours(
        userId,
        DEFAULT_SETTINGS.nightStartHour,
        DEFAULT_SETTINGS.nightStartMinute,
        DEFAULT_SETTINGS.nightEndHour,
        DEFAULT_SETTINGS.nightEndMinute
      ),
    ]);
  },
}));
