import { useCallback, useState } from 'react';

import type { CameraCaptureSource, CapturedPhoto } from '../camera/cameraAdapter';
import { evaluateLandmarks } from '../domain/landmarkRules';
import type { GuideReferencePoints, NormalizedRect } from '../domain/guidelineGeometry';
import { detectLandmarks } from '../services/landmarkApi';
import type { LandmarkEvaluation } from '../types';

type UseMeasure2DParams = {
  camera: CameraCaptureSource;
  guidePoints: GuideReferencePoints | null;
  guideRect: NormalizedRect | null;
};

type ManualCaptureResult = {
  photo: CapturedPhoto;
  evaluation: LandmarkEvaluation;
};

export function useMeasure2D({ camera, guidePoints, guideRect }: UseMeasure2DParams) {
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<LandmarkEvaluation | null>(null);

  const analyzeCapture = useCallback(async (): Promise<ManualCaptureResult | null> => {
    const photo = await camera.capturePhoto({
      quality: 0.8,
      skipProcessing: true,
    });

    console.log('[measure2d] 촬영 결과', {
      hasUri: Boolean(photo?.uri),
      width: photo?.width,
      height: photo?.height,
      hasGuidePoints: Boolean(guidePoints),
      hasGuideRect: Boolean(guideRect),
    });

    if (!photo?.uri || !guidePoints || !guideRect) {
      console.log('[measure2d] 촬영 분석 중단', {
        hasUri: Boolean(photo?.uri),
        hasGuidePoints: Boolean(guidePoints),
        hasGuideRect: Boolean(guideRect),
      });
      return null;
    }

    try {
      const response = await detectLandmarks(photo.uri);

      if (!response.detected || !response.landmarks) {
        console.log('[measure2d] 사람 감지 실패', {
          detected: response.detected,
          landmarkCount: response.landmarks?.length ?? 0,
        });
        const nextEvaluation: LandmarkEvaluation = {
          aligned: false,
          score: 0,
          reasons: ['사람을 찾지 못했습니다.'],
        };
        setEvaluation(nextEvaluation);
        return { photo, evaluation: nextEvaluation };
      }

      const nextEvaluation = evaluateLandmarks(response.landmarks, guidePoints, guideRect);
      console.log('[measure2d] 최종 판정 결과', nextEvaluation);
      setEvaluation(nextEvaluation);
      return { photo, evaluation: nextEvaluation };
    } catch (error) {
      console.log('[measure2d] 랜드마크 분석 예외', error);
      const nextEvaluation: LandmarkEvaluation = {
        aligned: false,
        score: 0,
        reasons: ['랜드마크 분석에 실패했습니다.'],
      };
      setEvaluation(nextEvaluation);
      return { photo, evaluation: nextEvaluation };
    }
  }, [camera, guidePoints, guideRect]);

  const handleManualCapture = useCallback(async (): Promise<ManualCaptureResult | null> => {
    if (loading) return null;

    setLoading(true);
    try {
      return await analyzeCapture();
    } finally {
      setLoading(false);
    }
  }, [analyzeCapture, loading]);

  return {
    evaluation,
    handleManualCapture,
    loading,
  };
}
