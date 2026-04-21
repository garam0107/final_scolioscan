import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'scolioscan_access_token';
let memoryToken: string | null = null;

export function getAccessToken() {
  return memoryToken;
}

export function setAccessToken(token: string | null) {
  memoryToken = token;
}

export async function loadAccessToken() {
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
