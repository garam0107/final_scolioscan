import { guardedFetch } from '@/src/lib/networkAccessGuard';
import { getAccessToken } from '@/src/lib/tokenStorage';
import type { LandmarksApiResponse } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.');
}

export async function detectLandmarks(imageUri: string): Promise<LandmarksApiResponse> {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: 'measure2d.jpg',
    type: 'image/jpeg',
  } as any);
  const token = getAccessToken();
  const response = await guardedFetch(`${API_BASE_URL}/measure2d/landmarks`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail || `Measure2D landmarks request failed (${response.status})`);
  }

  const payload = (await response.json()) as LandmarksApiResponse;
  return payload;
}
