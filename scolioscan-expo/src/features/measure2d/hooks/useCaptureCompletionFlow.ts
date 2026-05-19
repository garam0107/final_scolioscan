import { useCallback, useEffect, useRef, useState } from 'react';

import type { CurvatureResponse } from '@/src/types/curvature';

export type CaptureLottieType = 'auto' | 'manual';

type AutoCaptureResult = {
  photo: {
    uri: string;
  };
};

type UseCaptureCompletionFlowParams = {
  autoAligned: boolean;
  autoCaptureResult: AutoCaptureResult | null;
  clearAutoCaptureResult: () => void;
  submitCurvature: (photoUri: string) => Promise<CurvatureResponse | null>;
  goToNextMeasurement: (curvatureMeasurementId: number) => void;
  resumeAutoCapture: () => void;
};

const CAPTURE_COMPLETE_DELAY_MS = 1000;

export function useCaptureCompletionFlow({
  autoAligned,
  autoCaptureResult,
  clearAutoCaptureResult,
  submitCurvature,
  goToNextMeasurement,
  resumeAutoCapture,
}: UseCaptureCompletionFlowParams) {
  const lottieCompletedRef = useRef(false);
  const captureSubmitInFlightRef = useRef(false);
  const [activeCaptureLottieType, setActiveCaptureLottieType] = useState<CaptureLottieType | null>(null);
  const [manualCaptureProgressVisible, setManualCaptureProgressVisible] = useState(false);
  const [captureCompleteVisible, setCaptureCompleteVisible] = useState(false);
  const [pendingCapturePhotoUri, setPendingCapturePhotoUri] = useState<string | null>(null);

  useEffect(() => {
    // 자동 촬영은 가이드에 맞는 순간부터 Lottie를 보여주고, 성공 사진이 생기기 전에는 벗어나면 숨긴다.
    if (manualCaptureProgressVisible) {
      return;
    }

    if (autoAligned) {
      lottieCompletedRef.current = false;
      setCaptureCompleteVisible(false);
      setActiveCaptureLottieType('auto');
      return;
    }

    if (!autoCaptureResult && !pendingCapturePhotoUri) {
      lottieCompletedRef.current = false;
      setCaptureCompleteVisible(false);
      setActiveCaptureLottieType((current) => (current === 'auto' ? null : current));
    }
  }, [autoAligned, autoCaptureResult, manualCaptureProgressVisible, pendingCapturePhotoUri]);

  useEffect(() => {
    // 자동 촬영 성공 사진은 완료 Lottie와 토스트가 끝난 뒤 제출하기 위해 잠시 보관한다.
    if (!autoCaptureResult) return;

    setPendingCapturePhotoUri(autoCaptureResult.photo.uri);
    setActiveCaptureLottieType('auto');
    if (lottieCompletedRef.current) {
      setCaptureCompleteVisible(true);
    }
    clearAutoCaptureResult();
  }, [autoCaptureResult, clearAutoCaptureResult]);

  useEffect(() => {
    // 자동/수동 모두 완료 UI가 표시된 뒤 1초 기다렸다가 척추측만 분석 API를 호출한다.
    if (!captureCompleteVisible || !pendingCapturePhotoUri || captureSubmitInFlightRef.current) {
      return;
    }

    let cancelled = false;
    captureSubmitInFlightRef.current = true;

    const submitAfterComplete = async () => {
      await new Promise((resolve) => setTimeout(resolve, CAPTURE_COMPLETE_DELAY_MS));

      if (cancelled) {
        return;
      }

      const curvature = await submitCurvature(pendingCapturePhotoUri);

      if (cancelled) {
        return;
      }

      captureSubmitInFlightRef.current = false;

      if (curvature) {
        setPendingCapturePhotoUri(null);
        setManualCaptureProgressVisible(false);
        setActiveCaptureLottieType(null);
        setCaptureCompleteVisible(false);
        goToNextMeasurement(curvature.id);
        return;
      }

      lottieCompletedRef.current = false;
      setPendingCapturePhotoUri(null);
      setManualCaptureProgressVisible(false);
      setActiveCaptureLottieType(null);
      setCaptureCompleteVisible(false);
      resumeAutoCapture();
    };

    void submitAfterComplete();

    return () => {
      cancelled = true;
      captureSubmitInFlightRef.current = false;
    };
  }, [
    captureCompleteVisible,
    goToNextMeasurement,
    pendingCapturePhotoUri,
    resumeAutoCapture,
    submitCurvature,
  ]);

  const startManualCaptureFlow = useCallback((photoUri: string) => {
    // 수동 촬영이 통과하면 자동 촬영과 같은 위치에 Lottie를 띄우고 완료 UI 이후 제출한다.
    lottieCompletedRef.current = false;
    setCaptureCompleteVisible(false);
    setManualCaptureProgressVisible(true);
    setPendingCapturePhotoUri(photoUri);
    setActiveCaptureLottieType('manual');
  }, []);

  const handleCaptureLottieFinish = useCallback(() => {
    if (lottieCompletedRef.current) {
      return false;
    }

    lottieCompletedRef.current = true;
    if (pendingCapturePhotoUri) {
      setCaptureCompleteVisible(true);
    }

    return true;
  }, [pendingCapturePhotoUri]);

  return {
    activeCaptureLottieType,
    captureCompleteVisible,
    isCaptureFlowBusy: manualCaptureProgressVisible || captureCompleteVisible || Boolean(pendingCapturePhotoUri),
    startManualCaptureFlow,
    handleCaptureLottieFinish,
  };
}
