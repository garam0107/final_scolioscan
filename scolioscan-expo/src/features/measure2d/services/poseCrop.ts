import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { detectPoseOnDevice, normalizeImageForPose } from './onDevicePose';
import type { LandmarkPoint } from '../types';

const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_ELBOW = 13;
const RIGHT_ELBOW = 14;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;
const MIN_VISIBILITY = 0.6;
const MIN_WIDTH_ASPECT_RATIO = 0.86;
const TOP_TORSO_PADDING_RATIO = 0.32;
// 11점 좌표 테스트에서 하체 포함량을 줄여 모델 예측 변화를 비교한다.

// 세로 하단 조절(수치를 높일수록 골반보다 위에서 잘리고, 낮출수록 아래까지 포함된다)
const BOTTOM_TORSO_PADDING_RATIO = 0.08;
const SIDE_SHOULDER_PADDING_RATIO = 0.12;
const MIN_IMAGE_EDGE_RATIO = 0.02;

type ImageSize = {
  width: number;
  height: number;
};

type CropRect = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

export type PoseCropResult = {
  uri: string;
  width: number;
  height: number;
  cropRect: CropRect;
};

export class PoseCropError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PoseCropError';
  }
}

function getPoint(landmarks: LandmarkPoint[], index: number) {
  const point = landmarks[index];
  if (!point || point.visibility < MIN_VISIBILITY) {
    throw new PoseCropError('어깨, 골반, 팔꿈치가 모두 보이도록 다시 촬영해주세요.');
  }

  if (
    point.x <= MIN_IMAGE_EDGE_RATIO ||
    point.x >= 1 - MIN_IMAGE_EDGE_RATIO ||
    point.y <= MIN_IMAGE_EDGE_RATIO ||
    point.y >= 1 - MIN_IMAGE_EDGE_RATIO
  ) {
    throw new PoseCropError('몸이 사진 가장자리에 너무 가깝습니다. 조금 떨어져서 다시 촬영해주세요.');
  }

  return point;
}

function clampOrigin(origin: number, size: number, boundary: number) {
  return Math.min(Math.max(origin, 0), Math.max(boundary - size, 0));
}

function createCropRect(landmarks: LandmarkPoint[], imageSize: ImageSize): CropRect {
  const leftShoulder = getPoint(landmarks, LEFT_SHOULDER);
  const rightShoulder = getPoint(landmarks, RIGHT_SHOULDER);
  const leftElbow = getPoint(landmarks, LEFT_ELBOW);
  const rightElbow = getPoint(landmarks, RIGHT_ELBOW);
  const leftHip = getPoint(landmarks, LEFT_HIP);
  const rightHip = getPoint(landmarks, RIGHT_HIP);

  const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipCenterY = (leftHip.y + rightHip.y) / 2;
  const torsoHeight = hipCenterY - shoulderCenterY;
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);

  if (torsoHeight <= 0 || shoulderWidth <= 0) {
    throw new PoseCropError('촬영 자세를 확인하지 못했습니다. 등을 카메라 쪽으로 향해 다시 촬영해주세요.');
  }

  const xPoints = [leftShoulder.x, rightShoulder.x, leftElbow.x, rightElbow.x, leftHip.x, rightHip.x];
  const rawLeft = Math.min(...xPoints) - shoulderWidth * SIDE_SHOULDER_PADDING_RATIO;
  const rawRight = Math.max(...xPoints) + shoulderWidth * SIDE_SHOULDER_PADDING_RATIO;
  const rawTop = shoulderCenterY - torsoHeight * TOP_TORSO_PADDING_RATIO;
  const rawBottom = hipCenterY - torsoHeight * BOTTOM_TORSO_PADDING_RATIO;

  let width = (rawRight - rawLeft) * imageSize.width;
  let height = (rawBottom - rawTop) * imageSize.height;
  let centerX = ((rawLeft + rawRight) / 2) * imageSize.width;
  let centerY = ((rawTop + rawBottom) / 2) * imageSize.height;

  // 세로는 줄인 값을 유지하고, 팔꿈치가 잘리지 않도록 최소 가로 폭만 확보한다.
  width = Math.max(width, height * MIN_WIDTH_ASPECT_RATIO);

  width = Math.min(width, imageSize.width);
  height = Math.min(height, imageSize.height);

  const originX = clampOrigin(centerX - width / 2, width, imageSize.width);
  const originY = clampOrigin(centerY - height / 2, height, imageSize.height);
  const marginX = width * MIN_IMAGE_EDGE_RATIO;
  const marginY = height * MIN_IMAGE_EDGE_RATIO;

  const pixelPoints = [leftShoulder, rightShoulder, leftElbow, rightElbow].map((point) => ({
    x: point.x * imageSize.width,
    y: point.y * imageSize.height,
  }));

  const hasRequiredPointNearCropEdge = pixelPoints.some(
    (point) =>
      point.x < originX + marginX ||
      point.x > originX + width - marginX ||
      point.y < originY + marginY ||
      point.y > originY + height - marginY,
  );

  if (hasRequiredPointNearCropEdge) {
    throw new PoseCropError('팔꿈치와 골반이 모두 보이도록 조금 더 여유를 두고 다시 촬영해주세요.');
  }

  return {
    originX: Math.round(originX),
    originY: Math.round(originY),
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}

export async function createPoseCrop(uri: string): Promise<PoseCropResult> {
  // EXIF 방향이 제거된 동일 파일을 Pose 추론과 ImageManipulator crop 양쪽에 사용한다.
  const normalizedImage = await normalizeImageForPose(uri);
  const imageSize = {
    width: normalizedImage.width,
    height: normalizedImage.height,
  };
  const poseResponse = await detectPoseOnDevice(normalizedImage.uri);

  if (!poseResponse.detected || !poseResponse.landmarks) {
    throw new PoseCropError('자세를 찾지 못했습니다. 등이 전체적으로 보이는 사진을 선택해주세요.');
  }

  const cropRect = createCropRect(poseResponse.landmarks, imageSize);
  const context = ImageManipulator.manipulate(normalizedImage.uri);
  context.crop(cropRect);
  const imageRef = await context.renderAsync();
  const croppedImage = await imageRef.saveAsync({
    compress: 1,
    format: SaveFormat.JPEG,
  });

  return {
    uri: croppedImage.uri,
    width: croppedImage.width,
    height: croppedImage.height,
    cropRect,
  };
}
