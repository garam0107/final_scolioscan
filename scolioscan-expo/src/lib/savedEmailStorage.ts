import * as SecureStore from 'expo-secure-store';

const SAVED_EMAIL_KEY = 'scolioscan_saved_email';

export async function loadSavedEmail() {
  return SecureStore.getItemAsync(SAVED_EMAIL_KEY);
}

export async function saveSavedEmail(email: string) {
  await SecureStore.setItemAsync(SAVED_EMAIL_KEY, email);
}

export async function clearSavedEmail() {
  await SecureStore.deleteItemAsync(SAVED_EMAIL_KEY);
}
