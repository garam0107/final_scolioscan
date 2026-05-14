import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'scolioscan_access_token';
let memoryToken: string | null = null;

export function getAccessToken() {
  // 즉시 필요한 API 요청은 SecureStore를 다시 읽지 않고 메모리 토큰을 사용한다.
  return memoryToken;
}

export function setAccessToken(token: string | null) {
  memoryToken = token;
}

export async function loadAccessToken() {
  // 앱 시작 시 SecureStore 값을 메모리에도 올려 이후 요청에서 바로 참조한다.
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  memoryToken = token;
  return token;
}

export async function saveAccessToken(token: string) {
  memoryToken = token;
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function clearAccessToken() {
  memoryToken = null;
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}
