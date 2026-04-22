export type CapturedPhoto = {
  uri: string;
  width?: number;
  height?: number;
};

export type CameraCaptureOptions = {
  quality?: number;
  skipProcessing?: boolean;
};

export type CameraCaptureSource = {
  capturePhoto: (options?: CameraCaptureOptions) => Promise<CapturedPhoto | null>;
};

