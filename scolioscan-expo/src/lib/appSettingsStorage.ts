import * as SecureStore from 'expo-secure-store';

const CELLULAR_DATA_ALLOWED_KEY = 'scolioscan_cellular_data_allowed';
const NIGHT_MODE_ENABLED_KEY = 'scolioscan_night_mode_enabled';
const NIGHT_MODE_START_HOUR_KEY = 'scolioscan_night_mode_start_hour';
const NIGHT_MODE_START_MINUTE_KEY = 'scolioscan_night_mode_start_minute';
const NIGHT_MODE_END_HOUR_KEY = 'scolioscan_night_mode_end_hour';
const NIGHT_MODE_END_MINUTE_KEY = 'scolioscan_night_mode_end_minute';

const DEFAULT_NIGHT_START_HOUR = 22;
const DEFAULT_NIGHT_START_MINUTE = 0;
const DEFAULT_NIGHT_END_HOUR = 6;
const DEFAULT_NIGHT_END_MINUTE = 0;

export type StoredNightModeSettings = {
  enabled: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
};

function getUserScopedKey(userId: string, key: string) {
  // 사용자별 로컬 설정이 서로 섞이지 않도록 SecureStore 키에 사용자 id를 포함한다.
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `scolioscan_user_${safeUserId}_${key}`;
}

function parseStoredTimeValue(value: string | null, fallback: number, max: number) {
  // 저장소에 잘못된 시간 값이 남아 있어도 설정 화면이 깨지지 않도록 기본값으로 보정한다.
  const parsedValue = Number(value);

  if (value === null || !Number.isInteger(parsedValue) || parsedValue < 0 || parsedValue > max) {
    return fallback;
  }

  return parsedValue;
}

export async function loadCellularDataAllowed(userId: string) {
  const savedValue = await SecureStore.getItemAsync(getUserScopedKey(userId, CELLULAR_DATA_ALLOWED_KEY));

  if (savedValue === null) {
    // 저장된 값이 없으면 데이터 사용을 기본 허용한다.
    return true;
  }

  return savedValue === '1';
}

export async function saveCellularDataAllowed(userId: string, allowed: boolean) {
  await SecureStore.setItemAsync(getUserScopedKey(userId, CELLULAR_DATA_ALLOWED_KEY), allowed ? '1' : '0');
}

export async function loadNightModeSettings(userId: string): Promise<StoredNightModeSettings> {
  const [enabledValue, startHourValue, startMinuteValue, endHourValue, endMinuteValue] = await Promise.all([
    SecureStore.getItemAsync(getUserScopedKey(userId, NIGHT_MODE_ENABLED_KEY)),
    SecureStore.getItemAsync(getUserScopedKey(userId, NIGHT_MODE_START_HOUR_KEY)),
    SecureStore.getItemAsync(getUserScopedKey(userId, NIGHT_MODE_START_MINUTE_KEY)),
    SecureStore.getItemAsync(getUserScopedKey(userId, NIGHT_MODE_END_HOUR_KEY)),
    SecureStore.getItemAsync(getUserScopedKey(userId, NIGHT_MODE_END_MINUTE_KEY)),
  ]);

  return {
    // 저장된 값이 없으면 야간 모드는 기본적으로 꺼진 상태다.
    enabled: enabledValue === '1',
    startHour: parseStoredTimeValue(startHourValue, DEFAULT_NIGHT_START_HOUR, 23),
    startMinute: parseStoredTimeValue(startMinuteValue, DEFAULT_NIGHT_START_MINUTE, 59),
    endHour: parseStoredTimeValue(endHourValue, DEFAULT_NIGHT_END_HOUR, 23),
    endMinute: parseStoredTimeValue(endMinuteValue, DEFAULT_NIGHT_END_MINUTE, 59),
  };
}

export async function saveNightModeEnabled(userId: string, enabled: boolean) {
  await SecureStore.setItemAsync(getUserScopedKey(userId, NIGHT_MODE_ENABLED_KEY), enabled ? '1' : '0');
}

export async function saveNightModeHours(
  userId: string,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number
) {
  await Promise.all([
    SecureStore.setItemAsync(getUserScopedKey(userId, NIGHT_MODE_START_HOUR_KEY), String(startHour)),
    SecureStore.setItemAsync(getUserScopedKey(userId, NIGHT_MODE_START_MINUTE_KEY), String(startMinute)),
    SecureStore.setItemAsync(getUserScopedKey(userId, NIGHT_MODE_END_HOUR_KEY), String(endHour)),
    SecureStore.setItemAsync(getUserScopedKey(userId, NIGHT_MODE_END_MINUTE_KEY), String(endMinute)),
  ]);
}
