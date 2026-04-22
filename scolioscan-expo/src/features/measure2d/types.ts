export type LandmarkPoint = {
  x: number;
  y: number;
  visibility: number;
};

export type LandmarksApiResponse = {
  detected: boolean;
  landmarks: LandmarkPoint[] | null;
};

export type LandmarkEvaluation = {
  aligned: boolean;
  score: number;
  reasons: string[];
};

