import type { RefObject } from 'react';

import type { CameraCaptureOptions, CameraCaptureSource, CapturedPhoto } from './cameraAdapter';

type ExpoCameraRef = {
  takePictureAsync: (options?: CameraCaptureOptions) => Promise<CapturedPhoto | null>;
};

export function createExpoCameraAdapter(cameraRef: RefObject<ExpoCameraRef | null>): CameraCaptureSource {
  return {
    capturePhoto: async (options) => {
      if (!cameraRef.current) {
        return null;
      }

      return cameraRef.current.takePictureAsync({
        quality: options?.quality ?? 0.9,
        skipProcessing: options?.skipProcessing ?? true,
        shutterSound: options?.shutterSound ?? false,
      });
    },
  };
}

