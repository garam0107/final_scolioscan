import * as SecureStore from 'expo-secure-store';

const CELLULAR_DATA_ALLOWED_KEY = 'scolioscan_cellular_data_allowed';
const NIGHT_MODE_ENABLED_KEY = 'scolioscan_night_mode_enabled';
const NIGHT_MODE_START_HOUR_KEY = 'scolioscan_night_mode_start_hour';
const NIGHT_MODE_END_HOUR_KEY = 'scolioscan_night_mode_end_hour';

const DEFAULT_NIGHT_START_HOUR = 22;
const DEFAULT_NIGHT_END_HOUR = 6;

export type StoredNightModeSettings = {
  enabled: boolean;
  startHour: number;
  endHour: number;
};

function parseStoredHour(value: string | null, fallback: number) {
  // 저장소에 잘못된 시간이 남아 있어도 설정 화면이 깨지지 않게 기본값으로 보정한다.
  const parsedHour = Number(value);

  if (!Number.isInteger(parsedHour) || parsedHour < 0 || parsedHour > 23) {
    return fallback;
  }

  return parsedHour;
}

export async function loadCellularDataAllowed() {
  const savedValue = await SecureStore.getItemAsync(CELLULAR_DATA_ALLOWED_KEY);

  if (savedValue === null) {
    // 저장된 값이 없으면 요즘 사용 패턴에 맞춰 모바일 데이터 사용을 기본 허용한다.
    return true;
  }

  return savedValue === '1';
}

export async function saveCellularDataAllowed(allowed: boolean) {
  await SecureStore.setItemAsync(CELLULAR_DATA_ALLOWED_KEY, allowed ? '1' : '0');
}

export async function loadNightModeSettings(): Promise<StoredNightModeSettings> {
  const [enabledValue, startHourValue, endHourValue] = await Promise.all([
    SecureStore.getItemAsync(NIGHT_MODE_ENABLED_KEY),
    SecureStore.getItemAsync(NIGHT_MODE_START_HOUR_KEY),
    SecureStore.getItemAsync(NIGHT_MODE_END_HOUR_KEY),
  ]);

  return {
    // 저장된 값이 없으면 야간 모드는 기본적으로 꺼진 상태로 둔다.
    enabled: enabledValue === '1',
    startHour: parseStoredHour(startHourValue, DEFAULT_NIGHT_START_HOUR),
    endHour: parseStoredHour(endHourValue, DEFAULT_NIGHT_END_HOUR),
  };
}

export async function saveNightModeEnabled(enabled: boolean) {
  await SecureStore.setItemAsync(NIGHT_MODE_ENABLED_KEY, enabled ? '1' : '0');
}

export async function saveNightModeHours(startHour: number, endHour: number) {
  await Promise.all([
    SecureStore.setItemAsync(NIGHT_MODE_START_HOUR_KEY, String(startHour)),
    SecureStore.setItemAsync(NIGHT_MODE_END_HOUR_KEY, String(endHour)),
  ]);
}
