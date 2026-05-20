export type LandmarkPoint = {
  x: number;
  y: number;
  z: number;
  visibility: number;
};

export type LandmarksApiResponse = {
  detected: boolean;
  landmarks: LandmarkPoint[] | null;
  face_detected?: boolean;
  face_score?: number;
  face_count?: number;
};

export type LandmarkEvaluation = {
  aligned: boolean;
  score: number;
  reasons: string[];
};

// 정면/후면 판정용 타입
export type FaceDetectionInfo = {
  faceDetected?: boolean;
  faceScore?: number;
  faceCount?: number;
};

