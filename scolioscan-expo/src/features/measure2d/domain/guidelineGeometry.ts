export type NormalizedRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

// 화면에 실제로 보이는 가이드라인의 픽셀 좌표를 담는 타입.
export type GuidelineDisplayGeometry = {
  guideX: number;
  guideY: number;
  guideWidth: number;
  guideHeight: number;
};

// 표시용 좌표(display)와 판정용 좌표(rect)를 한 번에 묶어서 전달한다.
export type GuidelineGeometry = {
  display: GuidelineDisplayGeometry;
  rect: NormalizedRect;
};

// SVG 원본 크기. 화면 스케일 계산의 기준점이다.
const BASE_W = 237;
const BASE_H = 588;
// 가이드라인 마네킹이 프리뷰 폭에서 차지할 비율.
const GUIDE_WIDTH_RATIO = 0.62;

// 픽셀 좌표를 0~1 범위의 정규화 rect로 바꿔서 landmark 좌표와 비교할 수 있게 한다.
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

// stage 크기를 기준으로 실제 표시 위치와 판정용 rect를 함께 만든다.
export function createGuidelineGeometry(
  previewWidth: number,
  previewHeight: number,
): GuidelineGeometry {
  const guideWidth = previewWidth * GUIDE_WIDTH_RATIO;
  const guideHeight = guideWidth * (BASE_H / BASE_W);
  const guideX = (previewWidth - guideWidth) / 2;
  const guideY = previewHeight - guideHeight;

  return {
    display: {
      guideX,
      guideY,
      guideWidth,
      guideHeight,
    },
    rect: buildGuideRect(guideX, guideY, guideWidth, guideHeight, previewWidth, previewHeight),
  };
}
