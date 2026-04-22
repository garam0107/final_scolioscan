import type { GuideReferencePoints } from './guidelineGeometry';
import type { LandmarkEvaluation, LandmarkPoint } from '../types';

// MediaPipe Pose landmark 인덱스(https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)
const NOSE = 0;
const LEFT_EYE = 2;
const RIGHT_EYE = 5;
const LEFT_EAR = 7;
const RIGHT_EAR = 8;

const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;

// 랜드마크를 "신뢰 가능한 점"으로 볼 최소 visibility
const MIN_VISIBILITY = 0.6;

// 가이드 기준점과의 허용 오차(정규화 좌표, 0~1)
const SHOULDER_X_TOLERANCE = 0.075;
const SHOULDER_Y_TOLERANCE = 0.09;
const HIP_X_TOLERANCE = 0.085;
const HIP_Y_TOLERANCE = 0.1;

// 전/후면 및 거리 판단용 임계값
const BEHIND_SHOULDER_DELTA = 0.02;
const FRONT_FACE_SCORE_THRESHOLD = 0.45;
const BACK_FACE_SCORE_THRESHOLD = 0.25;

const DIST_TOO_CLOSE = 1.22;
const DIST_TOO_FAR = 0.82;

// 판정에 사용하는 핵심 랜드마크를 이름으로 묶어 가독성 개선
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

function pointAt(landmarks: LandmarkPoint[], index: number): LandmarkPoint | null {
  return landmarks[index] ?? null;
}

function isVisible(point: LandmarkPoint | null, threshold = MIN_VISIBILITY) {
  return Boolean(point && point.visibility >= threshold);
}

function axisWithinTolerance(
  detected: LandmarkPoint | null,
  guide: { x: number; y: number },
  toleranceX: number,
  toleranceY: number,
) {
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

// 얼굴/몸통 그룹의 평균 visibility를 점수로 계산
function visibilityScore(points: (LandmarkPoint | null)[]) {
  const visible = points.filter((p): p is LandmarkPoint => Boolean(p));
  if (!visible.length) return 0;
  const sum = visible.reduce((acc, p) => acc + p.visibility, 0);
  return sum / visible.length;
}

// 필요한 랜드마크만 꺼내서 이후 계산에서 재사용
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

// 전/후면 판정:
// 1) 어깨 x 순서(안드로이드 기존 로직과 동일한 축) + 2) 얼굴/몸통 visibility 점수를 함께 사용
// 단일 지표 오탐을 줄이기 위해 확정/추정/판정불가를 분리한다.
function computeDirection(
  detected: NamedDetectedPoints,
  guidePoints: GuideReferencePoints,
) {
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
  const torsoScore = visibilityScore([
    detected.leftShoulder,
    detected.rightShoulder,
    detected.leftHip,
    detected.rightHip,
  ]);

  const guideShoulderCenter = midpointGuide(guidePoints.leftShoulder, guidePoints.rightShoulder);
  const detectedShoulderCenter =
    detected.leftShoulder && detected.rightShoulder
      ? midpoint(detected.leftShoulder, detected.rightShoulder)
      : null;

  const direction = (() => {
    if (shoulderOrderBack && faceScore <= BACK_FACE_SCORE_THRESHOLD) return '후면';
    if (!shoulderOrderBack && faceScore >= FRONT_FACE_SCORE_THRESHOLD) return '전면';
    if (shoulderOrderBack && torsoScore >= 0.7) return '후면(추정)';
    if (!shoulderOrderBack && torsoScore >= 0.7) return '전면(추정)';
    return '판정불가';
  })();

  return {
    direction,
    shoulderOrderBack,
    faceScore,
    torsoScore,
    detectedShoulderCenter,
    guideShoulderCenter,
  };
}

// 거리 판정:
// 감지된 신체 크기(어깨폭/상체높이)와 가이드 기준 크기를 비율로 비교해
// 가까움/적정/멀음을 판단한다.
function computeDistanceState(
  detected: NamedDetectedPoints,
  guidePoints: GuideReferencePoints,
) {
  if (!detected.leftShoulder || !detected.rightShoulder || !detected.leftHip || !detected.rightHip) {
    return { distanceState: '판정불가', scale: 0 };
  }

  const detectedShoulderWidth = Math.abs(detected.rightShoulder.x - detected.leftShoulder.x);
  const guideShoulderWidth = Math.abs(guidePoints.rightShoulder.x - guidePoints.leftShoulder.x);

  const detectedTorsoHeight =
    midpoint(detected.leftHip, detected.rightHip).y - midpoint(detected.leftShoulder, detected.rightShoulder).y;
  const guideTorsoHeight =
    midpointGuide(guidePoints.leftHip, guidePoints.rightHip).y -
    midpointGuide(guidePoints.leftShoulder, guidePoints.rightShoulder).y;

  if (guideShoulderWidth <= 0 || guideTorsoHeight <= 0) {
    return { distanceState: '판정불가', scale: 0 };
  }

  const shoulderRatio = detectedShoulderWidth / guideShoulderWidth;
  const torsoRatio = detectedTorsoHeight / guideTorsoHeight;
  const scale = (shoulderRatio + torsoRatio) / 2;

  if (scale > DIST_TOO_CLOSE) return { distanceState: '가까움', scale };
  if (scale < DIST_TOO_FAR) return { distanceState: '멀음', scale };
  return { distanceState: '적정', scale };
}

// 디버깅 로그:
// - 원본 랜드마크
// - 가이드 기준점
// - 최종 판정 요약(가이드정렬/전후면/거리)을 한 번에 출력
function logGuideComparison(
  detected: NamedDetectedPoints,
  guide: GuideReferencePoints,
  directionResult: ReturnType<typeof computeDirection>,
  distanceResult: ReturnType<typeof computeDistanceState>,
  aligned: boolean,
) {
  console.log('[측정2D] 랜드마크 좌표(11,12,23,24)', {
    '11_왼어깨': toFixedPoint(detected.leftShoulder),
    '12_오른어깨': toFixedPoint(detected.rightShoulder),
    '23_왼골반': toFixedPoint(detected.leftHip),
    '24_오른골반': toFixedPoint(detected.rightHip),
    '0_코': toFixedPoint(detected.nose),
    '7_왼귀': toFixedPoint(detected.leftEar),
    '8_오른귀': toFixedPoint(detected.rightEar),
  });

  console.log('[측정2D] 가이드 기준점 좌표', {
    왼어깨: toFixedGuide(guide.leftShoulder),
    오른어깨: toFixedGuide(guide.rightShoulder),
    왼골반: toFixedGuide(guide.leftHip),
    오른골반: toFixedGuide(guide.rightHip),
  });

  console.log('[측정2D] 자세 판정 결과', {
    가이드정렬: aligned ? '일치' : '불일치',
    전후면판정: directionResult.direction,
    거리판정: distanceResult.distanceState,
    얼굴가시성점수: Number(directionResult.faceScore.toFixed(3)),
    몸통가시성점수: Number(directionResult.torsoScore.toFixed(3)),
    어깨순서후면규칙: directionResult.shoulderOrderBack,
    거리스케일: Number(distanceResult.scale.toFixed(3)),
  });
}

export function evaluateLandmarks(
  landmarks: LandmarkPoint[],
  guidePoints: GuideReferencePoints,
): LandmarkEvaluation {
  // reasons는 UI에 노출되는 사용자 안내 메시지 우선순위로 사용
  const reasons: string[] = [];
  const detected = buildDetectedPoints(landmarks);

  const shouldersVisible = isVisible(detected.leftShoulder) && isVisible(detected.rightShoulder);
  const hipsVisible = isVisible(detected.leftHip) && isVisible(detected.rightHip);

  // 핵심 점(어깨/골반)이 안 보이면 다른 판정보다 먼저 실패 처리
  if (!shouldersVisible || !hipsVisible) {
    const directionResult = computeDirection(detected, guidePoints);
    const distanceResult = computeDistanceState(detected, guidePoints);
    logGuideComparison(detected, guidePoints, directionResult, distanceResult, false);

    return {
      aligned: false,
      score: 0,
      reasons: ['어깨와 골반이 가이드 안에 보이도록 서 주세요.'],
    };
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

  // 기존 정책 유지: 가이드 정렬은 어깨/골반 4점 허용오차 만족 여부로 결정
  if (!leftShoulderMatched || !rightShoulderMatched) {
    reasons.push('어깨 위치를 가이드라인 어깨 기준점에 맞춰 주세요.');
  }

  if (!leftHipMatched || !rightHipMatched) {
    reasons.push('골반 위치를 가이드라인 골반 기준점에 맞춰 주세요.');
  }

  const aligned = reasons.length === 0;
  const matchedCount = [leftShoulderMatched, rightShoulderMatched, leftHipMatched, rightHipMatched].filter(
    Boolean,
  ).length;
  const directionResult = computeDirection(detected, guidePoints);
  const distanceResult = computeDistanceState(detected, guidePoints);

  // 최종 결과와 함께 전후면/거리 판단도 로그로 남겨 QA 시 즉시 확인 가능
  logGuideComparison(detected, guidePoints, directionResult, distanceResult, aligned);

  return {
    aligned,
    score: Math.round((matchedCount / 4) * 100),
    reasons,
  };
}
