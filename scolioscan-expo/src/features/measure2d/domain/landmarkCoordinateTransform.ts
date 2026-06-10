import type { LandmarkPoint } from '../types';

type LandmarkPreviewTransformFrame = {
  photoWidth: number;
  photoHeight: number;
  previewWidth: number;
  previewHeight: number;
};

export function convertPhotoLandmarksToPreviewLandmarks(
  landmarks: LandmarkPoint[],
  frame: LandmarkPreviewTransformFrame,
): LandmarkPoint[] | null {
  const { photoWidth, photoHeight, previewWidth, previewHeight } = frame;

  if (photoWidth <= 0 || photoHeight <= 0 || previewWidth <= 0 || previewHeight <= 0) {
    return null;
  }

  // CameraView가 화면을 채우는 cover 방식이라고 보고 사진 좌표를 preview 좌표계로 변환한다.
  const scale = Math.max(previewWidth / photoWidth, previewHeight / photoHeight);
  const renderedWidth = photoWidth * scale;
  const renderedHeight = photoHeight * scale;
  const offsetX = (previewWidth - renderedWidth) / 2;
  const offsetY = (previewHeight - renderedHeight) / 2;

  return landmarks.map((landmark) => {
    const previewX = landmark.x * photoWidth * scale + offsetX;
    const previewY = landmark.y * photoHeight * scale + offsetY;

    return {
      ...landmark,
      x: previewX / previewWidth,
      y: previewY / previewHeight,
    };
  });
}
