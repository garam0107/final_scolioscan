import { Image } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CELLULAR_DATA_BLOCKED_MESSAGE, isCellularDataBlockedError } from '@/src/lib/networkAccessGuard';
import type { CameraCaptureSource, CapturedPhoto } from '../camera/cameraAdapter';
import { convertPhotoLandmarksToPreviewLandmarks } from '../domain/landmarkCoordinateTransform';
import { evaluateLandmarks } from '../domain/landmarkRules';
import type { GuideReferencePoints, NormalizedRect } from '../domain/guidelineGeometry';
import { detectPoseOnDevice } from '../services/onDevicePose';
import type { LandmarkEvaluation } from '../types';

type PreviewSize = {
  width: number;
  height: number;
};

type UseMeasure2DParams = {
  camera: CameraCaptureSource;
  guidePoints: GuideReferencePoints | null;
  guideRect: NormalizedRect | null;
  previewSize: PreviewSize | null;
  cameraReady: boolean;
};

type ManualCaptureResult = {
  photo: CapturedPhoto;
  evaluation: LandmarkEvaluation;
};

type AutoToast = {
  message: string;
  tone: 'info' | 'success' | 'warning' | 'error';
  key: number;
};

// 자동 촬영 조건을 확인 용 서버에 사진 보내는 주기
const AUTO_CHECK_INTERVAL_MS = 750;
// 자동 촬영 시간
const AUTO_HOLD_MS = 1600;
// 수동 촬영 클릭 후, 이미 자동 체크 촬영 진행 중이면 얼마까지 기다릴지 정하는 시간
const MANUAL_WAIT_TIMEOUT_MS = 1500;
// 촬영 타임아웃 상수 (카메라 촬영 요청에 걸리는 최대 시간)
const CAMERA_CAPTURE_TIMEOUT_MS = 5000;


// 타임아웃 헬퍼
async function capturePhotoWithTimeout(
  camera: CameraCaptureSource,
  options: Parameters<CameraCaptureSource['capturePhoto']>[0],
): Promise<CapturedPhoto | null> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      camera.capturePhoto(options),
      new Promise<CapturedPhoto | null>((resolve) => {
        timeoutId = setTimeout(() => {
          resolve(null);
        }, CAMERA_CAPTURE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
async function resolvePhotoSize(photo: CapturedPhoto): Promise<{ width: number; height: number } | null> {
  if (photo.width && photo.height) {
    return {
      width: photo.width,
      height: photo.height,
    };
  }

  return new Promise((resolve) => {
    Image.getSize(
      photo.uri,
      (width, height) => {
        resolve({ width, height });
      },
      () => {
        resolve(null);
      },
    );
  });
}
// 자동 체크는 서버 부하를 줄이기 위해 낮은 화질로 보내고, 실제 분석용 사진은 더 높은 화질로 촬영한다.
const AUTO_CHECK_QUALITY = 0.35;
const MANUAL_CHECK_QUALITY = 0.8;
const AUTO_FINAL_QUALITY = 0.85;

const LANDMARK_NOT_FOUND = '사람을 찾지 못했습니다.';
const LANDMARK_ANALYZE_FAIL = '랜드마크 분석에 실패했습니다.';
const AUTO_CAPTURE_SUCCESS = '좋아요. 이 자세로 촬영할게요!';
const LANDMARK_PHOTO_SIZE_FAIL = '디버그: 사진 크기 확인 실패';
const LANDMARK_CONVERT_FAIL = '디버그: 좌표 변환 실패';
const LANDMARK_NATIVE_FAIL = '디버그: ML Kit 호출 실패';
export function useMeasure2D({ camera, guidePoints, guideRect, previewSize, cameraReady }: UseMeasure2DParams) {
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<LandmarkEvaluation | null>(null);
  const [autoAligned, setAutoAligned] = useState(false);
  const [autoToast, setAutoToast] = useState<AutoToast | null>(null);
  const [autoCaptureResult, setAutoCaptureResult] = useState<ManualCaptureResult | null>(null);

  // ref 값들은 렌더링과 무관한 진행 상태를 저장해서 중복 촬영과 중복 서버 호출을 막는다.
  const captureInFlightRef = useRef(false);
  const manualInProgressRef = useRef(false);
  const autoPausedRef = useRef(false);
  const alignedSinceRef = useRef<number | null>(null);
  const autoCaptureCompletedRef = useRef(false);
  const toastKeyRef = useRef(0);
  const lastAutoReasonRef = useRef<string | null>(null);
  const autoSuccessToastShownRef = useRef(false);

  const resetAutoAlignment = useCallback(() => {
    // 자세가 가이드에서 벗어나면 자동 촬영 대기 상태를 처음부터 다시 잡는다.
    // 자세가 흐트러지면 자동 촬영 대기 시간과 화면 카운트다운을 함께 초기화한다.
    alignedSinceRef.current = null;
    autoSuccessToastShownRef.current = false;
    setAutoAligned(false);
  }, []);

  const pauseAutoCapture = useCallback(() => {
    // 사용자가 직접 촬영을 누른 동안 자동 촬영 루프가 끼어들지 못하게 잠시 멈춘다.
    // 수동 촬영 결과를 기다리는 동안 자동 체크가 새로 시작되지 않도록 외부에서 잠글 수 있다.
    autoPausedRef.current = true;
    resetAutoAlignment();
  }, [resetAutoAlignment]);

  const resumeAutoCapture = useCallback(() => {
    // 수동 촬영이 실패하거나 제출로 이어지지 않으면 자동 촬영을 다시 허용한다.
    // 수동 촬영이 실패했거나 자세 기준을 통과하지 못한 경우 다시 자동 체크를 허용한다.
    autoPausedRef.current = false;
  }, []);

  const emitAutoToast = useCallback((message: string, tone: AutoToast['tone']) => {
    toastKeyRef.current += 1;
    setAutoToast({
      message,
      tone,
      key: toastKeyRef.current,
    });
  }, []);

  const clearAutoToast = useCallback(() => {
    // 칩이 사라진 뒤에도 같은 자세 상태가 계속되면 다시 안내할 수 있도록 마지막 reason도 비운다.
    lastAutoReasonRef.current = null;
    setAutoToast(null);
  }, []);

  const analyzeCapture = useCallback(async (quality: number, skipProcessing: boolean): Promise<ManualCaptureResult | null> => {
    // 촬영한 사진을 랜드마크 서버에 보내고, 가이드 기준 안에 들어왔는지 같은 평가 규칙으로 판정한다.
    // 수동 촬영과 자동 체크가 같은 분석 경로를 쓰도록 촬영과 랜드마크 판정을 한곳에서 처리한다.
  const photo = await capturePhotoWithTimeout(camera, {
      quality,
      skipProcessing,
    });



    if (!photo?.uri || !guidePoints || !guideRect || !previewSize) {
      return null;
    }

    try {
      const response = await detectPoseOnDevice(photo.uri);

        if (!response.detected || !Array.isArray(response.landmarks) || response.landmarks.length === 0) {
          const nextEvaluation: LandmarkEvaluation = {
            aligned: false,
            score: 0,
            reasons: [LANDMARK_NOT_FOUND],
          };
          setEvaluation(nextEvaluation);
          return { photo, evaluation: nextEvaluation };
        }

        const photoSize = await resolvePhotoSize(photo);

        if (!photoSize) {
          const nextEvaluation: LandmarkEvaluation = {
            aligned: false,
            score: 0,
            reasons: [LANDMARK_PHOTO_SIZE_FAIL],
          };
          setEvaluation(nextEvaluation);
          return { photo, evaluation: nextEvaluation };
        }

        const previewLandmarks = convertPhotoLandmarksToPreviewLandmarks(response.landmarks, {
          photoWidth: photoSize.width,
          photoHeight: photoSize.height,
          previewWidth: previewSize.width,
          previewHeight: previewSize.height,
        });

      if (!previewLandmarks) {
        const nextEvaluation: LandmarkEvaluation = {
          aligned: false,
          score: 0,
          reasons: [LANDMARK_CONVERT_FAIL],
        };
        setEvaluation(nextEvaluation);
        return { photo, evaluation: nextEvaluation };
      }

      const nextEvaluation = evaluateLandmarks(previewLandmarks, guidePoints, guideRect, {
        faceDetected: response.face_detected,
        faceScore: response.face_score,
        faceCount: response.face_count,
      });
      setEvaluation(nextEvaluation);
      return { photo, evaluation: nextEvaluation };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const message = isCellularDataBlockedError(error) ? CELLULAR_DATA_BLOCKED_MESSAGE : `디버그: 예외 발생 - ${errorMessage}`;
      const nextEvaluation: LandmarkEvaluation = {
        aligned: false,
        score: 0,
        reasons: [message],
      };
      setEvaluation(nextEvaluation);
      return { photo, evaluation: nextEvaluation };
    }
  }, [camera, guidePoints, guideRect, previewSize]);

  const handleManualCapture = useCallback(async (): Promise<ManualCaptureResult | null> => {
    // 자동 분석 요청이 진행 중이면 잠깐 기다린 뒤, 수동 촬영 결과를 우선 처리한다.
    // 사용자가 직접 촬영하면 자동 체크 루프와 겹치지 않도록 잠시 기다린 뒤 수동 촬영을 우선한다.
    manualInProgressRef.current = true;
    resetAutoAlignment();
    if (!cameraReady) {
      console.error('[measure2d] 수동 촬영 중단: 카메라가 아직 준비되지 않음');
      manualInProgressRef.current = false;
      return null;
    }
    const waitStart = Date.now();
    while (captureInFlightRef.current && Date.now() - waitStart < MANUAL_WAIT_TIMEOUT_MS) {
      await new Promise((resolve) => setTimeout(resolve, 60));
    }

    if (loading || captureInFlightRef.current) {
      manualInProgressRef.current = false;
      return null;
    }

    setLoading(true);
    captureInFlightRef.current = true;
    try {
      return await analyzeCapture(MANUAL_CHECK_QUALITY, true);
    } finally {
      captureInFlightRef.current = false;
      setLoading(false);
      manualInProgressRef.current = false;
    }
  }, [analyzeCapture, cameraReady, loading, resetAutoAlignment]);
  // 자동 촬영
  useEffect(() => {
    if (!cameraReady || !guidePoints || !guideRect || !previewSize) {
      resetAutoAlignment();
      lastAutoReasonRef.current = null;
      setAutoToast(null);
      return;
    }
    // return;
    let disposed = false;

    // 자동 촬영 루프는 일정 간격으로 저화질 사진을 보내 현재 자세가 기준 안에 있는지 확인한다.
    const runAutoCheck = async () => {
      // 낮은 품질의 사진으로 자세만 검사해 서버 부하를 줄이고, 최종 저장용 사진은 나중에 다시 찍는다.
      if (
        disposed ||
        autoPausedRef.current ||
        manualInProgressRef.current ||
        captureInFlightRef.current ||
        autoCaptureCompletedRef.current
      ) {
        return;
      }

      captureInFlightRef.current = true;
      try {
        const result = await analyzeCapture(AUTO_CHECK_QUALITY, false);

        if (!result || disposed || autoPausedRef.current || manualInProgressRef.current) {
          resetAutoAlignment();
          return;
        }

        if (!result.evaluation.aligned) {
          resetAutoAlignment();
          const reason = result.evaluation.reasons[0] ?? null;
          if (reason && reason !== lastAutoReasonRef.current) {
            lastAutoReasonRef.current = reason;
            emitAutoToast(reason, 'warning');
          }
          return;
        }

        lastAutoReasonRef.current = null;

        if (!alignedSinceRef.current) {
          // 처음으로 기준에 들어온 시점을 저장하고, 이 시점부터 1.5초 유지 여부를 계산한다.
          alignedSinceRef.current = Date.now();
        }

        const elapsed = Date.now() - alignedSinceRef.current;

        setAutoAligned(true);
        if (!autoSuccessToastShownRef.current) {
          // 가이드라인이 초록색으로 바뀌는 첫 정렬 시점에 촬영 안내를 먼저 보여준다.
          autoSuccessToastShownRef.current = true;
          emitAutoToast(AUTO_CAPTURE_SUCCESS, 'success');
        }

        if (elapsed >= AUTO_HOLD_MS) {
          // 정렬 상태가 충분히 유지된 순간에만 고품질 최종 사진을 촬영해 다음 분석 단계로 넘긴다.
          // 1.5초 동안 기준을 유지했을 때만 최종 사진을 다시 촬영해서 실제 척추측만 분석으로 넘긴다.
          autoCaptureCompletedRef.current = true;
          const finalPhoto = await capturePhotoWithTimeout(camera, {
            quality: AUTO_FINAL_QUALITY,
            skipProcessing: true,
            shutterSound: false,
          });

          if (finalPhoto?.uri && !disposed) {
              setAutoCaptureResult({
                photo: finalPhoto,
                evaluation: result.evaluation,
              });
            } else {
              autoCaptureCompletedRef.current = false;
            }


          resetAutoAlignment();
        }
      } catch (error) {
        resetAutoAlignment();
      } finally {
        captureInFlightRef.current = false;
      }
    };

    void runAutoCheck();
    const timer = setInterval(() => {
      void runAutoCheck();
    }, AUTO_CHECK_INTERVAL_MS);

    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [analyzeCapture, camera,cameraReady, emitAutoToast, guidePoints, guideRect, previewSize, resetAutoAlignment]);


  return {
    evaluation,
    handleManualCapture,
    loading,
    autoAligned,
    autoToast,
    autoCaptureResult,
    pauseAutoCapture,
    resumeAutoCapture,
    clearAutoToast,
    clearAutoCaptureResult: () => setAutoCaptureResult(null),
  };
}
