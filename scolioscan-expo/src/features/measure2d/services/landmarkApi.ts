import { guardedFetch } from '@/src/lib/networkAccessGuard';
import type { LandmarksApiResponse } from '../types';

const AIS_API_BASE_URL = process.env.EXPO_PUBLIC_AIS_API_BASE_URL;

if (!AIS_API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_AIS_API_BASE_URL이 설정되지 않았습니다.');
}

export async function detectLandmarks(imageUri: string): Promise<LandmarksApiResponse> {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: 'measure2d.jpg',
    type: 'image/jpeg',
  } as any);



  const response = await guardedFetch(`${AIS_API_BASE_URL}/landmarks`, {
    method: 'POST',
    body: formData,
  });



  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail || `AIS landmarks request failed (${response.status})`);
  }

  const payload = (await response.json()) as LandmarksApiResponse;
  return payload;
}
