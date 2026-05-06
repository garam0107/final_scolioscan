import type { LandmarksApiResponse } from '../types';

const AIS_API_BASE_URL = process.env.EXPO_PUBLIC_AIS_API_BASE_URL || 'http://localhost:8002/ais';

export async function detectLandmarks(imageUri: string): Promise<LandmarksApiResponse> {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: 'measure2d.jpg',
    type: 'image/jpeg',
  } as any);

  const response = await fetch(`${AIS_API_BASE_URL}/landmarks`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail || `AIS landmarks request failed (${response.status})`);
  }

  const payload = (await response.json()) as LandmarksApiResponse;
  // console.log('[measure2d] /ais/landmarks response:', payload);
  return payload;
}
