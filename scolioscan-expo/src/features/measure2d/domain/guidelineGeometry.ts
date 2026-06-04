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

export type GuidelineGeometryOptions = {
  topReservedHeight?: number;
  bottomReservedHeight?: number;
};

const BASE_W = 237;
const BASE_H = 588;
// 가이드라인 비율 조정
const GUIDE_WIDTH_RATIO = 0.72;

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
  // 화면 픽셀 좌표로 만든 가이드 영역을 랜드마크 서버 응답과 같은 0~1 좌표계로 변환한다.
  return {
    left: guideX / previewWidth,
    top: guideY / previewHeight,
    right: (guideX + guideWidth) / previewWidth,
    bottom: (guideY + guideHeight) / previewHeight,
  };
}

export function createGuideReferencePoints(rect: NormalizedRect): GuideReferencePoints {
  // 어깨와 골반 기준점은 전체 가이드 박스 안의 상대 비율로 고정한다.
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
  options: GuidelineGeometryOptions = {},
): GuidelineGeometry {
  // 기준 SVG 비율을 유지하면서 카메라 프리뷰 아래쪽에 가이드 박스를 배치한다.
  const preferredGuideWidth = previewWidth * GUIDE_WIDTH_RATIO;
  const guideAspectRatio = BASE_H / BASE_W;
  const topBoundary = Math.max(options.topReservedHeight ?? 0, 0);
  const bottomBoundary = Math.max(previewHeight - Math.max(options.bottomReservedHeight ?? 0, 0), topBoundary);
  const maxGuideHeight = bottomBoundary - topBoundary;
  let guideWidth = preferredGuideWidth;
  let guideHeight = guideWidth * guideAspectRatio;

  // 작은 화면에서는 상단 안내 영역과 하단 네비게이션 영역 사이에 들어오도록 같은 비율로 줄인다.
  if (maxGuideHeight > 0 && guideHeight > maxGuideHeight) {
    guideHeight = maxGuideHeight;
    guideWidth = guideHeight / guideAspectRatio;
  }
  // 가이드는 화면 하단에 붙여 전신이 프레임 안에 들어오도록 유도한다.
  const guideX = (previewWidth - guideWidth) / 2;
  // 하단 안전 여백 위를 기준선으로 삼아 기기별 하단바에 가이드가 가려지지 않게 한다.
  const guideY = bottomBoundary - guideHeight;
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
