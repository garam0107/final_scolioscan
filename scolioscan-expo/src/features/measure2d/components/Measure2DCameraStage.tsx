import React from 'react';
import { View } from 'react-native';
import { CameraView } from 'expo-camera';

import { styles } from '../measure2d.styles';
import { CameraGuidelineOverlay } from './CameraGuidelineOverlay';
import type { GuidelineGeometry } from '../domain/guidelineGeometry';

type StageLayout = {
  width: number;
  height: number;
};

type Measure2DCameraStageProps = {
  cameraRef: React.RefObject<any>;
  stageLayout: StageLayout;
  guidelineGeometry: GuidelineGeometry | null;
  autoAligned: boolean;
  onStageLayoutChange: (layout: StageLayout) => void;
  onCameraReady: () => void;
  onCameraMountError: (message: string) => void;
};

export function Measure2DCameraStage({
  cameraRef,
  stageLayout,
  guidelineGeometry,
  autoAligned,
  onStageLayoutChange,
  onCameraReady,
  onCameraMountError,
}: Measure2DCameraStageProps) {
  return (
    <View
      style={styles.cameraStage}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        // 레이아웃이 확정된 뒤 가이드 비율 계산에 사용할 stage 크기를 화면으로 전달한다.
        onStageLayoutChange({ width, height });
      }}
    >
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        animateShutter={false}
        onCameraReady={onCameraReady}
        onMountError={(event) => {
          onCameraMountError(event.message);
        }}
      />
      {guidelineGeometry ? (
        <CameraGuidelineOverlay
          width={stageLayout.width}
          height={stageLayout.height}
          geometry={guidelineGeometry.display}
          aligned={autoAligned}
        />
      ) : null}
    </View>
  );
}
