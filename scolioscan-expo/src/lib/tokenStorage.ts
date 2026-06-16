import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'scolioscan_access_token';
const REFRESH_TOKEN_KEY = 'scolioscan_refresh_token';
const DEVICE_ID_KEY = 'scolioscan_device_id';

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

function createRandomId() {
  // 설치 단위 식별자는 보안 토큰이 아니므로 SecureStore에 넣을 난수 문자열만 간단히 만든다.
  return `device_${Date.now()}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

export function getAccessToken() {
  // 즉시 필요한 API 요청은 SecureStore를 다시 읽지 않고 메모리 access token을 사용한다.
  return memoryAccessToken;
}

export function getRefreshToken() {
  // refresh 요청도 동일하게 메모리 캐시를 우선 사용해 불필요한 저장소 접근을 줄인다.
  return memoryRefreshToken;
}

export function setAccessToken(token: string | null) {
  memoryAccessToken = token;
}

export function setRefreshToken(token: string | null) {
  memoryRefreshToken = token;
}

export async function loadAccessToken() {
  // 앱 시작 시 SecureStore 값을 메모리에 올려 이후 요청에서 바로 참조한다.
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  memoryAccessToken = token;
  return token;
}

export async function loadRefreshToken() {
  // refresh token도 앱 시작 시 메모리에 올려 자동 갱신 흐름에서 재사용한다.
  const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  memoryRefreshToken = token;
  return token;
}

export async function saveAccessToken(token: string) {
  memoryAccessToken = token;
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function saveRefreshToken(token: string) {
  memoryRefreshToken = token;
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function saveAuthTokens(accessToken: string, refreshToken: string) {
  // 로그인과 토큰 재발급에서는 access/refresh token을 항상 같은 시점에 함께 갱신한다.
  memoryAccessToken = accessToken;
  memoryRefreshToken = refreshToken;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearAccessToken() {
  memoryAccessToken = null;
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

export async function clearRefreshToken() {
  memoryRefreshToken = null;
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearAuthTokens() {
  // 로그아웃과 세션 만료 시 두 토큰을 함께 지워 복구 경로가 섞이지 않게 한다.
  memoryAccessToken = null;
  memoryRefreshToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export async function getOrCreateDeviceId() {
  // 백엔드가 같은 설치를 추적할 수 있도록 device_id를 1회 생성 후 계속 재사용한다.
  const existingDeviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existingDeviceId) {
    return existingDeviceId;
  }

  const nextDeviceId = createRandomId();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, nextDeviceId);
  return nextDeviceId;
}
