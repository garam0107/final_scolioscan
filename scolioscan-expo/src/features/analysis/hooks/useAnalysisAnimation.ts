import { useCallback, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

type UseAnalysisAnimationResult = {
  progress: Animated.Value;
  angleAnimationKey: number;
  startAnalysisAnimation: (duration: number) => void;
  resetAnalysisAnimation: () => void;
};

export function useAnalysisAnimation(shouldReplayOnFocus: boolean): UseAnalysisAnimationResult {
  const [angleAnimationKey, setAngleAnimationKey] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  const startAnalysisAnimation = useCallback((duration: number) => {
    // 척추 뼈, 표시 원, 각도 숫자를 같은 타이밍으로 처음 상태에서 다시 재생합니다.
    progress.stopAnimation();
    progress.setValue(0);
    setAngleAnimationKey((value) => value + 1);
    Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const resetAnalysisAnimation = useCallback(() => {
    // API 오류 상태에서는 기존처럼 진행값만 초기화해 화면을 기본 위치로 되돌립니다.
    progress.setValue(0);
  }, [progress]);

  useFocusEffect(
    useCallback(() => {
      if (shouldReplayOnFocus) {
        startAnalysisAnimation(1600);
      }
    }, [shouldReplayOnFocus, startAnalysisAnimation]),
  );

  return {
    progress,
    angleAnimationKey,
    startAnalysisAnimation,
    resetAnalysisAnimation,
  };
}
