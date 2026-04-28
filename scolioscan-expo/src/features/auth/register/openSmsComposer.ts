// Linking은 앱 밖의 URL 스킴 열 수 있게 해줌
import { Linking, Platform } from 'react-native';

type OpenSmsComposerParams = {
  phoneNumber: string;
  message: string;
};

export async function openSmsComposer({ phoneNumber, message }: OpenSmsComposerParams) {
  if (Platform.OS === 'android') {
    return openAndroidSmsComposer({ phoneNumber, message });
  }

  if (Platform.OS === 'ios') {
    return openIosSmsComposer({ phoneNumber, message });
  }

  return false;
}

async function openAndroidSmsComposer({ phoneNumber, message }: OpenSmsComposerParams) {
  const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
  const canOpen = await Linking.canOpenURL(url);

  if (!canOpen) {
    return false;
  }

  await Linking.openURL(url);
  return true;
}

async function openIosSmsComposer({ phoneNumber, message }: OpenSmsComposerParams) {
  const url = `sms:${phoneNumber}&body=${encodeURIComponent(message)}`;
  const canOpen = await Linking.canOpenURL(url);

  if (!canOpen) {
    return false;
  }

  await Linking.openURL(url);
  return true;
}
