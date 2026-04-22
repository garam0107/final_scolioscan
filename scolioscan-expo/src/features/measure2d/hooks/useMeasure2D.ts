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
  const [guideMessage, setGuideMessage] = useState(
    '가이드라인에 맞춰 서신 뒤 수동 촬영 버튼을 눌러 주세요.',
  );
  const [evaluation, setEvaluation] = useState<LandmarkEvaluation | null>(null);

  const analyzeCapture = useCallback(async (): Promise<ManualCaptureResult | null> => {
    const photo = await camera.capturePhoto({
      quality: 0.8,
      skipProcessing: true,
    });

    if (!photo?.uri) {
      setGuideMessage('사진을 가져오지 못했습니다. 다시 시도해 주세요.');
      return null;
    }

    if (!guidePoints) {
      setGuideMessage('가이드라인 기준점을 불러오는 중입니다. 잠시만 기다려 주세요.');
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
        setGuideMessage('사람을 찾지 못했습니다. 가이드라인 안으로 다시 맞춰 주세요.');
        return { photo, evaluation: nextEvaluation };
      }

      const nextEvaluation = evaluateLandmarks(response.landmarks, guidePoints);
      setEvaluation(nextEvaluation);
      setGuideMessage(
        nextEvaluation.aligned
          ? '좋아요. 가이드라인에 잘 맞았습니다.'
          : nextEvaluation.reasons[0] ?? '가이드라인에 맞춰 다시 서 주세요.',
      );

      return { photo, evaluation: nextEvaluation };
    } catch {
      const nextEvaluation: LandmarkEvaluation = {
        aligned: false,
        score: 0,
        reasons: ['랜드마크 분석에 실패했습니다.'],
      };
      setEvaluation(nextEvaluation);
      setGuideMessage('랜드마크 분석에 실패했습니다. 다시 시도해 주세요.');
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
    guideMessage,
    handleManualCapture,
    loading,
  };
}
