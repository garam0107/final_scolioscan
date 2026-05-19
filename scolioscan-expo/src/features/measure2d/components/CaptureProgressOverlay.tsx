import React, { useRef } from 'react';
import { Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';

import { styles } from '../measure2d.styles';
import type { CaptureLottieType } from '../hooks/useCaptureCompletionFlow';

const AutoCaptureLottie = require('../../../../assets/lottie/autocapture_progress_rad.json');
const ManualCaptureLottie = require('../../../../assets/lottie/manualcapture_progress_rad.json');

type CaptureLottieLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type CaptureProgressOverlayProps = {
  activeType: CaptureLottieType | null;
  completeVisible: boolean;
  layout: CaptureLottieLayout | null;
  onLottieFinish: () => boolean;
};

export function CaptureProgressOverlay({
  activeType,
  completeVisible,
  layout,
  onLottieFinish,
}: CaptureProgressOverlayProps) {
  const lottieRef = useRef<LottieView>(null);

  return (
    <>
      {completeVisible ? (
        <View style={styles.captureCompleteBackdrop} pointerEvents="none">
          <BlurView
            intensity={60}
            tint="light"
            experimentalBlurMethod="dimezisBlurView"
            style={styles.captureCompleteBlur}
          />
          <View style={styles.captureCompleteTint} />
        </View>
      ) : null}

      {activeType && layout ? (
        <View style={[styles.testLottieWrap, layout]} pointerEvents="none">
          <LottieView
            key={activeType}
            ref={lottieRef}
            source={activeType === 'manual' ? ManualCaptureLottie : AutoCaptureLottie}
            loop={false}
            resizeMode="contain"
            style={styles.testLottie}
            onLayout={() => {
              requestAnimationFrame(() => {
                lottieRef.current?.play(32, 150);
              });
            }}
            onAnimationFinish={() => {
              if (!onLottieFinish()) {
                return;
              }

              requestAnimationFrame(() => {
                lottieRef.current?.play(150, 150);
              });
            }}
          />
        </View>
      ) : null}

      {completeVisible ? (
        <View style={styles.captureCompleteToast} pointerEvents="none">
          <Text style={styles.captureCompleteToastText}>촬영이 완료되었어요!</Text>
        </View>
      ) : null}
    </>
  );
}
