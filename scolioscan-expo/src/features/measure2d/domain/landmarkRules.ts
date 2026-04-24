import type { LandmarkEvaluation, LandmarkPoint } from '../types';
import type { GuideReferencePoints } from './guidelineGeometry';

// MediaPipe Pose landmark 인덱스
const NOSE = 0;
const LEFT_EYE = 2;
const RIGHT_EYE = 5;
const LEFT_EAR = 7;
const RIGHT_EAR = 8;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;

// 기본 가시성 임계치
const MIN_VISIBILITY = 0.6;

// 가이드 4점(어깨/골반) 허용 오차
const SHOULDER_X_TOLERANCE = 0.075;
const SHOULDER_Y_TOLERANCE = 0.09;
const HIP_X_TOLERANCE = 0.085;
const HIP_Y_TOLERANCE = 0.1;

// 후면/전면 판정 임계치
const BEHIND_SHOULDER_DELTA = 0.02;
const FACE_VISIBLE_FRONT_THRESHOLD = 0.55;
const FACE_VISIBLE_BACK_THRESHOLD = 0.3;

// 거리 판정 임계치 (감지 스케일 / 가이드 스케일)
const DIST_TOO_CLOSE = 1.22;
const DIST_TOO_FAR = 0.8;

const REASON_BODY_NOT_VISIBLE = '어깨와 골반이 가이드 안에 보이도록 서주세요.';
const REASON_BACK_VIEW = '뒷모습이 보이게 서주세요.';
const REASON_CLOSER = '조금 더 가까이 와주세요.';
const REASON_FARTHER = '조금 더 멀리 떨어져주세요.';
const REASON_SHOULDER_ALIGN = '어깨 위치를 가이드라인에 맞춰주세요.';
const REASON_HIP_ALIGN = '골반 위치를 가이드라인에 맞춰주세요.';

type NamedDetectedPoints = {
  nose: LandmarkPoint | null;
  leftEye: LandmarkPoint | null;
  rightEye: LandmarkPoint | null;
  leftEar: LandmarkPoint | null;
  rightEar: LandmarkPoint | null;
  leftShoulder: LandmarkPoint | null;
  rightShoulder: LandmarkPoint | null;
  leftHip: LandmarkPoint | null;
  rightHip: LandmarkPoint | null;
};

type DirectionLabel = '후면' | '전면' | '판정불가';
type DistanceLabel = '가까움' | '적정' | '멀음' | '판정불가';

function pointAt(landmarks: LandmarkPoint[], index: number): LandmarkPoint | null {
  return landmarks[index] ?? null;
}

function isVisible(point: LandmarkPoint | null, threshold = MIN_VISIBILITY): boolean {
  return Boolean(point && point.visibility >= threshold);
}

function axisWithinTolerance(
  detected: LandmarkPoint | null,
  guide: { x: number; y: number },
  toleranceX: number,
  toleranceY: number,
): boolean {
  if (!detected) return false;
  return Math.abs(detected.x - guide.x) <= toleranceX && Math.abs(detected.y - guide.y) <= toleranceY;
}

function midpoint(a: LandmarkPoint, b: LandmarkPoint) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function midpointGuide(a: { x: number; y: number }, b: { x: number; y: number }) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function visibilityScore(points: Array<LandmarkPoint | null>) {
  const visible = points.filter((point): point is LandmarkPoint => Boolean(point));
  if (!visible.length) return 0;
  const total = visible.reduce((acc, point) => acc + point.visibility, 0);
  return total / visible.length;
}

function buildDetectedPoints(landmarks: LandmarkPoint[]): NamedDetectedPoints {
  return {
    nose: pointAt(landmarks, NOSE),
    leftEye: pointAt(landmarks, LEFT_EYE),
    rightEye: pointAt(landmarks, RIGHT_EYE),
    leftEar: pointAt(landmarks, LEFT_EAR),
    rightEar: pointAt(landmarks, RIGHT_EAR),
    leftShoulder: pointAt(landmarks, LEFT_SHOULDER),
    rightShoulder: pointAt(landmarks, RIGHT_SHOULDER),
    leftHip: pointAt(landmarks, LEFT_HIP),
    rightHip: pointAt(landmarks, RIGHT_HIP),
  };
}

/**
 * 후면/전면 판정
 * - shoulderOrderBack: 기존 앱 규칙(양쪽 어깨 x 순서) 유지
 * - faceScore: 얼굴 랜드마크 visibility 평균값
 * - 두 값을 함께 사용해 전면/후면/판정불가로 분류
 */
function computeDirection(detected: NamedDetectedPoints) {
  const shoulderOrderBack = (() => {
    if (!detected.leftShoulder || !detected.rightShoulder) return false;
    return detected.rightShoulder.x - detected.leftShoulder.x > BEHIND_SHOULDER_DELTA;
  })();

  const faceScore = visibilityScore([
    detected.nose,
    detected.leftEye,
    detected.rightEye,
    detected.leftEar,
    detected.rightEar,
  ]);

  let direction: DirectionLabel = '판정불가';
  if (shoulderOrderBack && faceScore <= FACE_VISIBLE_BACK_THRESHOLD) {
    direction = '후면';
  } else if (!shoulderOrderBack && faceScore >= FACE_VISIBLE_FRONT_THRESHOLD) {
    direction = '전면';
  } else if (shoulderOrderBack && faceScore < FACE_VISIBLE_FRONT_THRESHOLD) {
    direction = '후면';
  }

  return {
    direction,
    shoulderOrderBack,
    faceScore,
  };
}

/**
 * 거리 판정
 * - 감지된 어깨너비/몸통높이를 가이드 기준값과 비율로 비교
 * - 비율이 크면 가까움, 작으면 멂
 */
function computeDistanceState(detected: NamedDetectedPoints, guidePoints: GuideReferencePoints) {
  if (!detected.leftShoulder || !detected.rightShoulder || !detected.leftHip || !detected.rightHip) {
    return { distanceState: '판정불가' as DistanceLabel, scale: 0 };
  }

  const detectedShoulderWidth = Math.abs(detected.rightShoulder.x - detected.leftShoulder.x);
  const guideShoulderWidth = Math.abs(guidePoints.rightShoulder.x - guidePoints.leftShoulder.x);

  const detectedTorsoHeight =
    midpoint(detected.leftHip, detected.rightHip).y - midpoint(detected.leftShoulder, detected.rightShoulder).y;
  const guideTorsoHeight =
    midpointGuide(guidePoints.leftHip, guidePoints.rightHip).y -
    midpointGuide(guidePoints.leftShoulder, guidePoints.rightShoulder).y;

  if (guideShoulderWidth <= 0 || guideTorsoHeight <= 0) {
    return { distanceState: '판정불가' as DistanceLabel, scale: 0 };
  }

  const shoulderRatio = detectedShoulderWidth / guideShoulderWidth;
  const torsoRatio = detectedTorsoHeight / guideTorsoHeight;
  const scale = (shoulderRatio + torsoRatio) / 2;

  if (scale > DIST_TOO_CLOSE) return { distanceState: '가까움' as DistanceLabel, scale };
  if (scale < DIST_TOO_FAR) return { distanceState: '멀음' as DistanceLabel, scale };
  return { distanceState: '적정' as DistanceLabel, scale };
}

function toFixedPoint(point: LandmarkPoint | null) {
  if (!point) return null;
  return {
    x: Number(point.x.toFixed(4)),
    y: Number(point.y.toFixed(4)),
    visibility: Number(point.visibility.toFixed(4)),
  };
}

function toFixedGuide(point: { x: number; y: number }) {
  return {
    x: Number(point.x.toFixed(4)),
    y: Number(point.y.toFixed(4)),
  };
}

function logGuideComparison(
  detected: NamedDetectedPoints,
  guide: GuideReferencePoints,
  directionResult: ReturnType<typeof computeDirection>,
  distanceResult: ReturnType<typeof computeDistanceState>,
  aligned: boolean,
) {
  console.log('[measure2d] 감지 랜드마크 (11,12,23,24)', {
    p11_leftShoulder: toFixedPoint(detected.leftShoulder),
    p12_rightShoulder: toFixedPoint(detected.rightShoulder),
    p23_leftHip: toFixedPoint(detected.leftHip),
    p24_rightHip: toFixedPoint(detected.rightHip),
  });

  console.log('[measure2d] 가이드 기준 좌표', {
    leftShoulder: toFixedGuide(guide.leftShoulder),
    rightShoulder: toFixedGuide(guide.rightShoulder),
    leftHip: toFixedGuide(guide.leftHip),
    rightHip: toFixedGuide(guide.rightHip),
  });

  console.log('[measure2d] 자세 판정 요약', {
    guideAligned: aligned ? '일치' : '불일치',
    direction: directionResult.direction,
    distance: distanceResult.distanceState,
    shoulderOrderBack: directionResult.shoulderOrderBack,
    faceVisibilityScore: Number(directionResult.faceScore.toFixed(3)),
    distanceScale: Number(distanceResult.scale.toFixed(3)),
  });
}

/**
 * 최종 판정 순서
 * 1) 어깨/골반 가시성 체크
 * 2) 전면/후면, 거리 판정
 * 3) 가이드 4점(좌/우 어깨, 좌/우 골반) 오차 판정
 */
export function evaluateLandmarks(
  landmarks: LandmarkPoint[],
  guidePoints: GuideReferencePoints,
): LandmarkEvaluation {
  const reasons: string[] = [];
  const detected = buildDetectedPoints(landmarks);

  const shouldersVisible = isVisible(detected.leftShoulder) && isVisible(detected.rightShoulder);
  const hipsVisible = isVisible(detected.leftHip) && isVisible(detected.rightHip);
  const directionResult = computeDirection(detected);
  const distanceResult = computeDistanceState(detected, guidePoints);

  if (!shouldersVisible || !hipsVisible) {
    logGuideComparison(detected, guidePoints, directionResult, distanceResult, false);
    return {
      aligned: false,
      score: 0,
      reasons: [REASON_BODY_NOT_VISIBLE],
    };
  }

  if (directionResult.direction === '전면') {
    reasons.push(REASON_BACK_VIEW);
  } else if (distanceResult.distanceState === '멀음') {
    reasons.push(REASON_CLOSER);
  } else if (distanceResult.distanceState === '가까움') {
    reasons.push(REASON_FARTHER);
  }

  const leftShoulderMatched = axisWithinTolerance(
    detected.leftShoulder,
    guidePoints.leftShoulder,
    SHOULDER_X_TOLERANCE,
    SHOULDER_Y_TOLERANCE,
  );
  const rightShoulderMatched = axisWithinTolerance(
    detected.rightShoulder,
    guidePoints.rightShoulder,
    SHOULDER_X_TOLERANCE,
    SHOULDER_Y_TOLERANCE,
  );
  const leftHipMatched = axisWithinTolerance(
    detected.leftHip,
    guidePoints.leftHip,
    HIP_X_TOLERANCE,
    HIP_Y_TOLERANCE,
  );
  const rightHipMatched = axisWithinTolerance(
    detected.rightHip,
    guidePoints.rightHip,
    HIP_X_TOLERANCE,
    HIP_Y_TOLERANCE,
  );

  if (!leftShoulderMatched || !rightShoulderMatched) {
    reasons.push(REASON_SHOULDER_ALIGN);
  }
  if (!leftHipMatched || !rightHipMatched) {
    reasons.push(REASON_HIP_ALIGN);
  }

  const aligned = reasons.length === 0;
  const matchedCount = [leftShoulderMatched, rightShoulderMatched, leftHipMatched, rightHipMatched].filter(
    Boolean,
  ).length;

  logGuideComparison(detected, guidePoints, directionResult, distanceResult, aligned);

  return {
    aligned,
    score: Math.round((matchedCount / 4) * 100),
    reasons,
  };
}
