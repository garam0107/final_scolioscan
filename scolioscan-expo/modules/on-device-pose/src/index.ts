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
  nativeModule ??= requireNativeModule<OnDevicePoseNativeModule>('OnDevicePose');
  return nativeModule;
}

export async function detectPoseOnDevice(imageUri: string): Promise<OnDevicePoseResult> {
  return getNativeModule().detectPoseOnDevice(imageUri);
}
