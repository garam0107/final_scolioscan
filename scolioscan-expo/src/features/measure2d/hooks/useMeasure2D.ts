import { useCallback, useState } from 'react';

import type { CameraCaptureSource, CapturedPhoto } from '../camera/cameraAdapter';
import { evaluateLandmarks } from '../domain/landmarkRules';
import type { GuideReferencePoints } from '../domain/guidelineGeometry';
import { detectLandmarks } from '../services/landmarkApi';
import type { LandmarkEvaluation } from '../types';

type UseMeasure2DParams = {
  camera: CameraCaptureSource;
  guidePoints: GuideReferencePoints | null;
};

type ManualCaptureResult = {
  photo: CapturedPhoto;
  evaluation: LandmarkEvaluation;
};

export function useMeasure2D({ camera, guidePoints }: UseMeasure2DParams) {
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<LandmarkEvaluation | null>(null);

  const analyzeCapture = useCallback(async (): Promise<ManualCaptureResult | null> => {
    const photo = await camera.capturePhoto({
      quality: 0.8,
      skipProcessing: true,
    });

    if (!photo?.uri || !guidePoints) {
      return null;
    }

    try {
      const response = await detectLandmarks(photo.uri);

      if (!response.detected || !response.landmarks) {
        const nextEvaluation: LandmarkEvaluation = {
          aligned: false,
          score: 0,
          reasons: ['사람을 찾지 못했습니다.'],
        };
        setEvaluation(nextEvaluation);
        return { photo, evaluation: nextEvaluation };
      }

      const nextEvaluation = evaluateLandmarks(response.landmarks, guidePoints);
      setEvaluation(nextEvaluation);
      return { photo, evaluation: nextEvaluation };
    } catch {
      const nextEvaluation: LandmarkEvaluation = {
        aligned: false,
        score: 0,
        reasons: ['랜드마크 분석에 실패했습니다.'],
      };
      setEvaluation(nextEvaluation);
      return { photo, evaluation: nextEvaluation };
    }
  }, [camera, guidePoints]);

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
