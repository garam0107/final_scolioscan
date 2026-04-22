import type { GuideReferencePoints } from './guidelineGeometry';
import type { LandmarkEvaluation, LandmarkPoint } from '../types';

const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;

const MIN_VISIBILITY = 0.6;

const SHOULDER_X_TOLERANCE = 0.075;
const SHOULDER_Y_TOLERANCE = 0.09;
const HIP_X_TOLERANCE = 0.085;
const HIP_Y_TOLERANCE = 0.1;

type NamedDetectedPoints = {
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

function buildDetectedPoints(landmarks: LandmarkPoint[]): NamedDetectedPoints {
  return {
    leftShoulder: pointAt(landmarks, LEFT_SHOULDER),
    rightShoulder: pointAt(landmarks, RIGHT_SHOULDER),
    leftHip: pointAt(landmarks, LEFT_HIP),
    rightHip: pointAt(landmarks, RIGHT_HIP),
  };
}

function logGuideComparison(detected: NamedDetectedPoints, guide: GuideReferencePoints) {
  const detectedShoulderCenter =
    detected.leftShoulder && detected.rightShoulder
      ? midpoint(detected.leftShoulder, detected.rightShoulder)
      : null;
  const detectedHipCenter =
    detected.leftHip && detected.rightHip ? midpoint(detected.leftHip, detected.rightHip) : null;

  const guideShoulderCenter = midpointGuide(guide.leftShoulder, guide.rightShoulder);
  const guideHipCenter = midpointGuide(guide.leftHip, guide.rightHip);

  console.log('[measure2d] detected landmarks (11,12,23,24):', {
    p11_leftShoulder: toFixedPoint(detected.leftShoulder),
    p12_rightShoulder: toFixedPoint(detected.rightShoulder),
    p23_leftHip: toFixedPoint(detected.leftHip),
    p24_rightHip: toFixedPoint(detected.rightHip),
  });

  console.log('[measure2d] guide reference points:', {
    leftShoulder: toFixedGuide(guide.leftShoulder),
    rightShoulder: toFixedGuide(guide.rightShoulder),
    leftHip: toFixedGuide(guide.leftHip),
    rightHip: toFixedGuide(guide.rightHip),
  });

  console.log('[measure2d] center comparison:', {
    detectedShoulderCenter: detectedShoulderCenter
      ? { x: Number(detectedShoulderCenter.x.toFixed(4)), y: Number(detectedShoulderCenter.y.toFixed(4)) }
      : null,
    detectedHipCenter: detectedHipCenter
      ? { x: Number(detectedHipCenter.x.toFixed(4)), y: Number(detectedHipCenter.y.toFixed(4)) }
      : null,
    guideShoulderCenter: toFixedGuide(guideShoulderCenter),
    guideHipCenter: toFixedGuide(guideHipCenter),
  });
}

export function evaluateLandmarks(
  landmarks: LandmarkPoint[],
  guidePoints: GuideReferencePoints,
): LandmarkEvaluation {
  const reasons: string[] = [];
  const detected = buildDetectedPoints(landmarks);

  logGuideComparison(detected, guidePoints);

  const shouldersVisible = isVisible(detected.leftShoulder) && isVisible(detected.rightShoulder);
  const hipsVisible = isVisible(detected.leftHip) && isVisible(detected.rightHip);

  if (!shouldersVisible || !hipsVisible) {
    return {
      aligned: false,
      score: 0,
      reasons: ['어깨와 골반이 잘 보이도록 가이드라인 안에 서 주세요.'],
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

  return {
    aligned,
    score: Math.round((matchedCount / 4) * 100),
    reasons,
  };
}
