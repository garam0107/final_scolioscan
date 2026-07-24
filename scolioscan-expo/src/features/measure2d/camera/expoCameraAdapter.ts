import type { RefObject } from 'react';

import type { CameraCaptureOptions, CameraCaptureSource, CapturedPhoto } from './cameraAdapter';

type ExpoCameraRef = {
  takePictureAsync: (options?: CameraCaptureOptions) => Promise<CapturedPhoto | null>;
};

export function createExpoCameraAdapter(cameraRef: RefObject<ExpoCameraRef | null>): CameraCaptureSource {
  return {
    capturePhoto: async (options) => {
      if (!cameraRef.current) {
        console.log('[measure2d] 수동 촬영 실패 원인: 카메라 ref 없음');
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

