import {
  detectPoseOnDevice as detectNativePoseOnDevice,
  normalizeImageForPose as normalizeNativePoseImage,
} from '@/modules/on-device-pose';
import type { LandmarksApiResponse } from '../types';

export async function detectPoseOnDevice(imageUri: string): Promise<LandmarksApiResponse> {
  // 기존 서버 landmark 응답과 같은 형태만 반환해 판정/UI 흐름을 그대로 유지한다.
  return detectNativePoseOnDevice(imageUri);
}

export async function normalizeImageForPose(imageUri: string) {
  return normalizeNativePoseImage(imageUri);
}
