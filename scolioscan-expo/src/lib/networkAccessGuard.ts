import { Alert } from 'react-native';

import { useAppSettingsStore } from '@/src/store/appSettingsStore';

export const CELLULAR_DATA_BLOCKED_MESSAGE = '모바일 데이터 사용이 꺼져 있어 Wi-Fi 연결이 필요합니다.';

type ExpoNetworkModule = typeof import('expo-network');

let networkModulePromise: Promise<ExpoNetworkModule> | null = null;
let lastCellularBlockedAlertAt = 0;

function loadNetworkModule() {
  // 네이티브 모듈은 실제 요청 직전에 불러와 개발 중 앱 시작 크래시를 피한다.
  networkModulePromise = networkModulePromise ?? import('expo-network');
  return networkModulePromise;
}

function showCellularDataBlockedAlert() {
  const now = Date.now();

  if (now - lastCellularBlockedAlertAt < 60000) {
    return;
  }

  lastCellularBlockedAlertAt = now;
  Alert.alert('셀룰러 데이터 사용 꺼짐', CELLULAR_DATA_BLOCKED_MESSAGE);
}

export class CellularDataBlockedError extends Error {
  constructor() {
    super(CELLULAR_DATA_BLOCKED_MESSAGE);
    this.name = 'CellularDataBlockedError';
  }
}

export function isCellularDataBlockedError(error: unknown) {
  return (
    error instanceof CellularDataBlockedError ||
    (error instanceof Error && error.name === 'CellularDataBlockedError')
  );
}

export async function assertNetworkRequestAllowed() {
  const { settingsLoaded, loadSettings } = useAppSettingsStore.getState();

  if (!settingsLoaded) {
    await loadSettings().catch(() => undefined);
  }

  let networkModule: ExpoNetworkModule;
  let networkState: Awaited<ReturnType<ExpoNetworkModule['getNetworkStateAsync']>>;

  try {
    networkModule = await loadNetworkModule();
    networkState = await networkModule.getNetworkStateAsync();
  } catch (error) {
    // 네트워크 타입 확인 실패만으로 요청을 막으면 정상 사용자가 막힐 수 있어 기존 요청 흐름을 유지한다.
    console.log('[network] 네트워크 상태 확인 실패', error);
    return;
  }

  const { cellularDataAllowed } = useAppSettingsStore.getState();

  // 설정이 꺼져 있을 때는 실제 모바일 데이터 연결에서만 API 요청을 차단한다.
  if (networkState.type === networkModule.NetworkStateType.CELLULAR && !cellularDataAllowed) {
    showCellularDataBlockedAlert();
    throw new CellularDataBlockedError();
  }
}

export async function guardedFetch(...args: Parameters<typeof fetch>) {
  await assertNetworkRequestAllowed();
  return fetch(...args);
}
