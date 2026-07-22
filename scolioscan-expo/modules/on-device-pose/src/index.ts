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

export type NormalizedPoseImage = {
  uri: string;
  width: number;
  height: number;
};

type OnDevicePoseNativeModule = {
  detectPoseOnDevice(imageUri: string): Promise<OnDevicePoseResult>;
  normalizeImageForPose(imageUri: string): Promise<NormalizedPoseImage>;
};

let nativeModule: OnDevicePoseNativeModule | null = null;

function getNativeModule(): OnDevicePoseNativeModule {
  nativeModule ??= requireNativeModule<OnDevicePoseNativeModule>('OnDevicePose');
  return nativeModule;
}

export async function detectPoseOnDevice(imageUri: string): Promise<OnDevicePoseResult> {
  return getNativeModule().detectPoseOnDevice(imageUri);
}

export async function normalizeImageForPose(imageUri: string): Promise<NormalizedPoseImage> {
  return getNativeModule().normalizeImageForPose(imageUri);
}
