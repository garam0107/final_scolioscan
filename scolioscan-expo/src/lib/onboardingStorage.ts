import * as SecureStore from 'expo-secure-store';

const INTRO_SEEN_KEY = 'scolioscan_intro_seen';

export async function loadIntroSeen() {
  return (await SecureStore.getItemAsync(INTRO_SEEN_KEY)) === '1';
}

export async function markIntroSeen() {
  await SecureStore.setItemAsync(INTRO_SEEN_KEY, '1');
}
