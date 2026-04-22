import type { NormalizedRect } from './guidelineGeometry';
import type { LandmarkEvaluation, LandmarkPoint } from '../types';

// MediaPipe Pose에서 자주 쓰는 핵심 랜드마크 인덱스.
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;
const NOSE = 0;

// 랜드마크 배열에서 특정 위치를 안전하게 꺼내는 헬퍼.
function pointAt(landmarks: LandmarkPoint[], index: number): LandmarkPoint | null {
  return landmarks[index] ?? null;
}

// 전달받은 가이드라인 rect 안에 점이 들어오는지 확인한다.
function isInsideRect(point: LandmarkPoint | null, rect: NormalizedRect, threshold = 0.5) {
  return Boolean(
    point &&
      point.visibility >= threshold &&
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom,
  );
}

// 랜드마크가 가이드라인 박스 안에 있는지 판정한다.
// 이 함수는 화면 표시용 가이드라인이 아니라, 부모가 계산해서 넘겨준 guideRect를 기준으로만 판단한다.
export function evaluateLandmarks(
  landmarks: LandmarkPoint[],
  guideRect: NormalizedRect,
): LandmarkEvaluation {
  const reasons: string[] = [];

  // 측정 준비에서 중요한 기준점: 머리, 양쪽 어깨, 양쪽 골반.
  const nose = pointAt(landmarks, NOSE);
  const leftShoulder = pointAt(landmarks, LEFT_SHOULDER);
  const rightShoulder = pointAt(landmarks, RIGHT_SHOULDER);
  const leftHip = pointAt(landmarks, LEFT_HIP);
  const rightHip = pointAt(landmarks, RIGHT_HIP);

  // 각 주요 포인트가 guideline rect 내부에 있는지 확인한다.
  const noseInside = isInsideRect(nose, guideRect, 0.4);
  const shouldersInside =
    isInsideRect(leftShoulder, guideRect) && isInsideRect(rightShoulder, guideRect);
  const hipsInside =
    isInsideRect(leftHip, guideRect) && isInsideRect(rightHip, guideRect);

  if (!noseInside) {
    reasons.push('머리가 가이드라인 안에 들어와야 해요.');
  }

  if (!shouldersInside) {
    reasons.push('어깨가 가이드라인 안에 들어와야 해요.');
  }

  if (!hipsInside) {
    reasons.push('골반이 가이드라인 안에 들어와야 해요.');
  }

  const aligned = noseInside && shouldersInside && hipsInside;

  return {
    aligned,
    score: aligned ? 1 : 0,
    reasons,
  };
}
