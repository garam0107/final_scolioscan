import { requireNativeModule } from 'expo';
import { Platform } from 'react-native';

export type OnDevicePoseLandmark = {
  x: number;
  y: number;
  z: number;
  visibility: number;
};

export type OnDevicePoseResult = {
  detected: boolean;
  landmarks: OnDevicePoseLandmark[] | null;
  face_detected?: boolean;
  face_score?: number;
  face_count?: number;
};

type OnDevicePoseNativeModule = {
  detectPoseOnDevice(imageUri: string): Promise<OnDevicePoseResult>;
};

let nativeModule: OnDevicePoseNativeModule | null = null;

function getNativeModule(): OnDevicePoseNativeModule {
  if (Platform.OS !== 'android') {
    throw new Error('온디바이스 포즈 판정은 현재 Android PoC에서만 지원됩니다.');
  }

  nativeModule ??= requireNativeModule<OnDevicePoseNativeModule>('OnDevicePose');
  return nativeModule;
}

export async function detectPoseOnDevice(imageUri: string): Promise<OnDevicePoseResult> {
  return getNativeModule().detectPoseOnDevice(imageUri);
}
