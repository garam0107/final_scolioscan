import type { LandmarkEvaluation, LandmarkPoint, FaceDetectionInfo } from '../types';
import type { GuideReferencePoints, NormalizedRect } from './guidelineGeometry';

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

// 가이드 영역을 조금 넓혀서 촬영자가 완벽히 맞추지 않아도 통과시킨다.
const GUIDE_AREA_PADDING_X = 0.06;
const GUIDE_AREA_PADDING_Y = 0.04;
const GUIDE_AREA_SCORE_THRESHOLD = 75;

// 후면/전면 판정 임계치
const BEHIND_SHOULDER_DELTA = 0.02;
const FACE_DETECTION_FRONT_THRESHOLD = 0.7;
// 거리 판정 임계치 (감지 스케일 / 가이드 스케일)
const DIST_TOO_CLOSE = 1.45;
const DIST_TOO_FAR = 0.58;

const REASON_BODY_NOT_VISIBLE = '어깨와 골반이 가이드 안에 보이도록 서주세요.';
const REASON_BACK_VIEW = '뒷모습이 보이게 서주세요.';
const REASON_CLOSER = '조금 더 가까이 와주세요.';
const REASON_FARTHER = '조금 더 멀리 떨어져주세요.';
const REASON_GUIDE_AREA_ALIGN = '몸이 가이드라인 안에 들어오도록 서주세요.';

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

type GuideAreaResult = {
  score: number;
  insideCount: number;
  totalCount: number;
};

function pointAt(landmarks: LandmarkPoint[], index: number): LandmarkPoint | null {
  return landmarks[index] ?? null;
}

function isVisible(point: LandmarkPoint | null, threshold = MIN_VISIBILITY): boolean {
  return Boolean(point && point.visibility >= threshold);
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


function buildDetectedPoints(landmarks: LandmarkPoint[]): NamedDetectedPoints {
  // MediaPipe Pose 인덱스를 화면에서 쓰는 이름 있는 관절 포인트로 바꾼다.
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
function computeDirection(detected: NamedDetectedPoints, faceInfo?: FaceDetectionInfo) {
  const shoulderOrderBack = (() => {
    if (!detected.leftShoulder || !detected.rightShoulder) return false;
    return detected.rightShoulder.x - detected.leftShoulder.x > BEHIND_SHOULDER_DELTA;
  })();

  const faceScore = faceInfo?.faceScore ?? 0;
  const faceCount = faceInfo?.faceCount ?? 0;
  const faceDetected =
    Boolean(faceInfo?.faceDetected) ||
    (faceCount > 0 && faceScore >= FACE_DETECTION_FRONT_THRESHOLD);

  const direction: DirectionLabel = faceDetected ? '전면' : '후면';

  return {
    direction,
    shoulderOrderBack,
    faceScore,
    faceCount,
    faceDetected,
  };
}

/**
 * 거리 판정
 * - 감지된 어깨너비/몸통높이를 가이드 기준값과 비율로 비교
 * - 비율이 크면 가까움, 작으면 멂
 */
function computeDistanceState(detected: NamedDetectedPoints, guidePoints: GuideReferencePoints) {
  // 감지된 어깨 폭과 몸통 높이를 가이드 기준과 비교해 카메라와의 거리를 판정한다.
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

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function expandRect(rect: NormalizedRect): NormalizedRect {
  return {
    left: clamp01(rect.left - GUIDE_AREA_PADDING_X),
    top: clamp01(rect.top - GUIDE_AREA_PADDING_Y),
    right: clamp01(rect.right + GUIDE_AREA_PADDING_X),
    bottom: clamp01(rect.bottom + GUIDE_AREA_PADDING_Y),
  };
}

function pointInRect(point: LandmarkPoint | null, rect: NormalizedRect) {
  if (!point) return false;
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

function computeGuideAreaScore(detected: NamedDetectedPoints, guideRect: NormalizedRect): GuideAreaResult {
  // 어깨와 골반 4개 핵심 포인트가 가이드 박스 안에 얼마나 들어왔는지 점수화한다.
  const expandedRect = expandRect(guideRect);
  const corePoints = [detected.leftShoulder, detected.rightShoulder, detected.leftHip, detected.rightHip];
  const insideCount = corePoints.filter((point) => pointInRect(point, expandedRect)).length;

  return {
    score: Math.round((insideCount / corePoints.length) * 100),
    insideCount,
    totalCount: corePoints.length,
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



/**
 * 최종 판정 순서
 * 1) 어깨/골반 가시성 체크
 * 2) 전면/후면, 거리 판정
 * 3) 어깨/골반이 가이드 영역 안에 대체로 들어왔는지 판정
 */
export function evaluateLandmarks(
  landmarks: LandmarkPoint[],
  guidePoints: GuideReferencePoints,
  guideRect: NormalizedRect,
  faceInfo?: FaceDetectionInfo,
): LandmarkEvaluation {
  // 후면 여부, 거리, 가이드 내부 위치를 차례대로 검사해 사용자 안내 문구를 만든다.
  const reasons: string[] = [];
  const detected = buildDetectedPoints(landmarks);
  
  const shouldersVisible = isVisible(detected.leftShoulder) && isVisible(detected.rightShoulder);
  const hipsVisible = isVisible(detected.leftHip) && isVisible(detected.rightHip);
  const directionResult = computeDirection(detected, faceInfo);
  const distanceResult = computeDistanceState(detected, guidePoints);
  const areaResult = computeGuideAreaScore(detected, guideRect);

  if (!shouldersVisible || !hipsVisible) {

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

  const score = areaResult.score;

  if (score < GUIDE_AREA_SCORE_THRESHOLD) {
    reasons.push(REASON_GUIDE_AREA_ALIGN);
  }

  // 방향, 거리, 가이드 영역 조건이 모두 통과해야 자동 또는 수동 촬영 성공으로 본다.
  const aligned = reasons.length === 0 && score >= GUIDE_AREA_SCORE_THRESHOLD;


  return {
    aligned,
    score,
    reasons,
  };
}
