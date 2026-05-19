import { Animated, Image, View } from 'react-native';

import styles from '../styles/analysisStage.styles';
import { VERTEBRA_COUNT } from '../analysisPose';

const spineImage = require('../../../../assets/images/spine.png');

type SpineSlice = {
  x: number;
  rotation: number;
};

type SpineMarkerData = {
  vertebraIndex: number;
  radiusRatio: number;
};

type SpineRigProps = {
  progress: Animated.Value;
  slices: SpineSlice[];
  markers: SpineMarkerData[];
  stageWidth: number;
  boneSize: number;
  spacing: number;
};

function ArcMarker({
  size,
  boneSize,
}: {
  size: number;
  boneSize: number;
}) {
  // 뼈의 중앙에 원을 배치해서 부모 뼈의 이동과 회전을 그대로 따라가게 합니다.
  return (
    <View
      style={[
        styles.arcMarker,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: (boneSize - size) / 2,
          top: (boneSize - size) / 2,
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.arcMarkerCenter, { width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21 }]} />
    </View>
  );
}

function SpineBone({
  x,
  rotation,
  progress,
  left,
  top,
  boneSize,
}: {
  x: number;
  rotation: number;
  progress: Animated.Value;
  left: number;
  top: number;
  boneSize: number;
}) {
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, x] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${rotation}deg`] });

  return (
    <Animated.View
      style={[
        styles.spineBone,
        {
          left,
          top,
          width: boneSize,
          height: boneSize,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ translateX }, { rotate }],
        },
      ]}
      pointerEvents="none"
    >
      <Image source={spineImage} style={[styles.spineImage, { width: boneSize, height: boneSize }]} />
    </Animated.View>
  );
}

function SpineMarker({
  x,
  rotation,
  progress,
  left,
  top,
  boneSize,
  markerSize,
}: {
  x: number;
  rotation: number;
  progress: Animated.Value;
  left: number;
  top: number;
  boneSize: number;
  markerSize: number;
}) {
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, x] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${rotation}deg`] });

  // 뼈와 같은 위치와 회전값을 쓰되 뼈 렌더링 후에 그려서 원이 항상 위에 보이게 합니다.
  return (
    <Animated.View
      style={[
        styles.spineBone,
        {
          left,
          top,
          width: boneSize,
          height: boneSize,
          zIndex: 20,
          transform: [{ translateX }, { rotate }],
        },
      ]}
      pointerEvents="none"
    >
      <ArcMarker size={markerSize} boneSize={boneSize} />
    </Animated.View>
  );
}

export default function SpineRig({
  progress,
  slices,
  markers,
  stageWidth,
  boneSize,
  spacing,
}: SpineRigProps) {
  const rigHeight = (VERTEBRA_COUNT - 1) * spacing + boneSize;
  const left = (stageWidth - boneSize) / 2;

  return (
    <View style={[styles.spineRig, { width: stageWidth, height: rigHeight }]} pointerEvents="none">
      {slices.map((slice, index) => (
        <SpineBone
          key={`bone-${index}`}
          x={slice.x}
          rotation={slice.rotation}
          progress={progress}
          left={left}
          top={index * spacing}
          boneSize={boneSize}
        />
      ))}

      {markers.map((marker) => {
        const slice = slices[marker.vertebraIndex];

        if (!slice) {
          return null;
        }

        return (
          <SpineMarker
            key={`marker-${marker.vertebraIndex}`}
            x={slice.x}
            rotation={slice.rotation}
            progress={progress}
            left={left}
            top={marker.vertebraIndex * spacing}
            boneSize={boneSize}
            markerSize={stageWidth * marker.radiusRatio * 2}
          />
        );
      })}
    </View>
  );
}
