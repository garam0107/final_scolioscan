import { useCallback, useState } from 'react';

import type { CameraCaptureSource, CapturedPhoto } from '../camera/cameraAdapter';
import { evaluateLandmarks } from '../domain/landmarkRules';
import type { NormalizedRect } from '../domain/guidelineGeometry';
import { detectLandmarks } from '../services/landmarkApi';
import type { LandmarkEvaluation } from '../types';

type UseMeasure2DParams = {
  camera: CameraCaptureSource;
  guideRect: NormalizedRect | null;
};

type ManualCaptureResult = {
  photo: CapturedPhoto;
  evaluation: LandmarkEvaluation;
};

export function useMeasure2D({ camera, guideRect }: UseMeasure2DParams) {
  const [loading, setLoading] = useState(false);
  // 사용자가 보는 현재 안내 문구. 촬영 성공/실패/판정 결과에 따라 바뀐다.
  const [guideMessage, setGuideMessage] = useState('가이드라인에 맞춰 수동 촬영을 해주세요.');
  // 최근 판정 결과. 화면 하단 상태 표시와 캡처 성공 여부 확인에 사용한다.
  const [evaluation, setEvaluation] = useState<LandmarkEvaluation | null>(null);

  const analyzeCapture = useCallback(
    async (): Promise<ManualCaptureResult | null> => {
      // 수동 촬영 버튼을 눌렀을 때만 사진을 찍는다.
      const photo = await camera.capturePhoto({
        quality: 0.8,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        setGuideMessage('사진을 가져오지 못했어요. 다시 시도해 주세요.');
        return null;
      }

      // 가이드라인 rect가 준비되지 않았으면 판정을 시작하지 않는다.
      if (!guideRect) {
        setGuideMessage('가이드라인을 불러오는 중이에요. 잠시만 기다려 주세요.');
        return null;
      }

      try {
        // 전체 사진을 AIS 서버로 보내서 MediaPipe 랜드마크를 추출한다.
        const response = await detectLandmarks(photo.uri);

        if (!response.detected || !response.landmarks) {
          const nextEvaluation: LandmarkEvaluation = {
            aligned: false,
            score: 0,
            reasons: ['인물을 찾지 못했어요.'],
          };
          setEvaluation(nextEvaluation);
          setGuideMessage('인물을 찾지 못했어요. 가이드라인 안에 다시 맞춰 주세요.');
          return { photo, evaluation: nextEvaluation };
        }

        // 추출한 랜드마크를 가이드라인 rect와 비교해서 안/밖 여부를 판단한다.
        const nextEvaluation = evaluateLandmarks(response.landmarks, guideRect);
        setEvaluation(nextEvaluation);
        console.log('[measure2d] landmark evaluation:', nextEvaluation);
        setGuideMessage(
          nextEvaluation.aligned
            ? '가이드라인과 잘 맞아요.'
            : nextEvaluation.reasons[0] ?? '가이드라인 안으로 맞춰 주세요.',
        );

        return { photo, evaluation: nextEvaluation };
      } catch {
        const nextEvaluation: LandmarkEvaluation = {
          aligned: false,
          score: 0,
          reasons: ['랜드마크 분석에 실패했어요.'],
        };
        setEvaluation(nextEvaluation);
        setGuideMessage('랜드마크 분석에 실패했어요. 다시 시도해 주세요.');
        return { photo, evaluation: nextEvaluation };
      }
    },
    [camera, guideRect],
  );

  const handleManualCapture = useCallback(async (): Promise<ManualCaptureResult | null> => {
    if (loading) {
      return null;
    }

    setLoading(true);

    try {
      return await analyzeCapture();
    } finally {
      setLoading(false);
    }
  }, [analyzeCapture, loading]);

  return {
    evaluation,
    guideMessage,
    handleManualCapture,
    loading,
  };
}
