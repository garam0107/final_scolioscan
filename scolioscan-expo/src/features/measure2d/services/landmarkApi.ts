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

  console.log('[measure2d] /ais/landmarks 요청 시작', {
    baseUrl: AIS_API_BASE_URL,
    imageUriPrefix: imageUri.slice(0, 48),
  });

  const response = await guardedFetch(`${AIS_API_BASE_URL}/landmarks`, {
    method: 'POST',
    body: formData,
  });

  console.log('[measure2d] /ais/landmarks 응답 상태', {
    ok: response.ok,
    status: response.status,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.log('[measure2d] /ais/landmarks 오류 응답', {
      status: response.status,
      detail,
    });
    throw new Error(detail || `AIS landmarks request failed (${response.status})`);
  }

  const payload = (await response.json()) as LandmarksApiResponse;
  console.log('[measure2d] /ais/landmarks 분석 결과', {
    detected: payload.detected,
    landmarkCount: payload.landmarks?.length ?? 0,
    faceDetected: payload.face_detected,
    faceScore: payload.face_score,
    faceCount: payload.face_count,
  });
  return payload;
}
