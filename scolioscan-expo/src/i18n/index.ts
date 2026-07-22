import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources, type AppLanguage } from '@/src/i18n/resources';

const LANGUAGE_STORAGE_KEY = 'scolioscan-app-language';
const supportedLanguages: AppLanguage[] = ['ko', 'en', 'ja'];

function getDeviceLanguage(): AppLanguage {
  const deviceLanguage = getLocales()[0]?.languageCode;
  return supportedLanguages.includes(deviceLanguage as AppLanguage)
    ? (deviceLanguage as AppLanguage)
    : 'ko';
}

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources,
  lng: 'ko',
  fallbackLng: 'ko',
  keySeparator: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export async function initializeLanguage() {
  const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  const language = supportedLanguages.includes(savedLanguage as AppLanguage)
    ? (savedLanguage as AppLanguage)
    : getDeviceLanguage();

  await i18n.changeLanguage(language);
}

export async function setAppLanguage(language: AppLanguage) {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function getAppLanguage(): AppLanguage {
  return supportedLanguages.includes(i18n.language as AppLanguage)
    ? (i18n.language as AppLanguage)
    : 'ko';
}

export { i18n };
