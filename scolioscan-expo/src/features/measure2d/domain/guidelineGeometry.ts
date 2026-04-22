export type NormalizedRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type NormalizedPoint = {
  x: number;
  y: number;
};

export type GuidelineDisplayGeometry = {
  guideX: number;
  guideY: number;
  guideWidth: number;
  guideHeight: number;
};

export type GuideReferencePoints = {
  leftShoulder: NormalizedPoint;
  rightShoulder: NormalizedPoint;
  leftHip: NormalizedPoint;
  rightHip: NormalizedPoint;
};

export type GuidelineGeometry = {
  display: GuidelineDisplayGeometry;
  rect: NormalizedRect;
  referencePoints: GuideReferencePoints;
};

const BASE_W = 237;
const BASE_H = 588;
const GUIDE_WIDTH_RATIO = 0.62;

const LEFT_SHOULDER_X_RATIO = 0.24;
const RIGHT_SHOULDER_X_RATIO = 0.76;
const SHOULDER_Y_RATIO = 0.37;
const LEFT_HIP_X_RATIO = 0.33;
const RIGHT_HIP_X_RATIO = 0.67;
const HIP_Y_RATIO = 0.72;

export function buildGuideRect(
  guideX: number,
  guideY: number,
  guideWidth: number,
  guideHeight: number,
  previewWidth: number,
  previewHeight: number,
): NormalizedRect {
  return {
    left: guideX / previewWidth,
    top: guideY / previewHeight,
    right: (guideX + guideWidth) / previewWidth,
    bottom: (guideY + guideHeight) / previewHeight,
  };
}

export function createGuideReferencePoints(rect: NormalizedRect): GuideReferencePoints {
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;

  return {
    leftShoulder: {
      x: rect.left + width * LEFT_SHOULDER_X_RATIO,
      y: rect.top + height * SHOULDER_Y_RATIO,
    },
    rightShoulder: {
      x: rect.left + width * RIGHT_SHOULDER_X_RATIO,
      y: rect.top + height * SHOULDER_Y_RATIO,
    },
    leftHip: {
      x: rect.left + width * LEFT_HIP_X_RATIO,
      y: rect.top + height * HIP_Y_RATIO,
    },
    rightHip: {
      x: rect.left + width * RIGHT_HIP_X_RATIO,
      y: rect.top + height * HIP_Y_RATIO,
    },
  };
}

export function createGuidelineGeometry(
  previewWidth: number,
  previewHeight: number,
): GuidelineGeometry {
  const guideWidth = previewWidth * GUIDE_WIDTH_RATIO;
  const guideHeight = guideWidth * (BASE_H / BASE_W);
  const guideX = (previewWidth - guideWidth) / 2;
  const guideY = previewHeight - guideHeight;
  const rect = buildGuideRect(guideX, guideY, guideWidth, guideHeight, previewWidth, previewHeight);

  return {
    display: {
      guideX,
      guideY,
      guideWidth,
      guideHeight,
    },
    rect,
    referencePoints: createGuideReferencePoints(rect),
  };
}
