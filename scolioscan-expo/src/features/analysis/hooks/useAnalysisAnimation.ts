import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

type UseAnalysisAnimationParams = {
  hasAnalysis: boolean;
  loading: boolean;
  error: string | null;
};

type UseAnalysisAnimationResult = {
  progress: Animated.Value;
  angleAnimationKey: number;
};

export function useAnalysisAnimation({
  hasAnalysis,
  loading,
  error,
}: UseAnalysisAnimationParams): UseAnalysisAnimationResult {
  const [angleAnimationKey, setAngleAnimationKey] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const didRunInitialAnimationRef = useRef(false);

  // 척추 변형과 각도 숫자 애니메이션을 처음 상태에서 다시 시작합니다.
  const startAnalysisAnimation = useCallback((duration: number) => {
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
    // 분석 결과가 없거나 오류가 있을 때 척추를 기본 위치로 되돌립니다.
    progress.stopAnimation();
    progress.setValue(0);
  }, [progress]);

  useEffect(() => {
    if (loading) {
      // 새 분석 결과를 불러오는 동안에는 첫 진입 애니메이션을 다시 실행할 수 있도록 초기화합니다.
      didRunInitialAnimationRef.current = false;
      progress.stopAnimation();
      progress.setValue(0);
      return;
    }

    if (error) {
      resetAnalysisAnimation();
      return;
    }

    if (!didRunInitialAnimationRef.current) {
      // 로딩이 끝난 직후 한 번만 실행해 탭 포커스 애니메이션과 중복되지 않게 합니다.
      didRunInitialAnimationRef.current = true;

      let firstFrameId: number | null = null;
      let secondFrameId: number | null = null;

      // 화면과 척추 이미지가 먼저 그려진 뒤 애니메이션을 시작해 첫 진입 시 끊김을 줄입니다.
      firstFrameId = requestAnimationFrame(() => {
        secondFrameId = requestAnimationFrame(() => {
          startAnalysisAnimation(hasAnalysis ? 2500 : 0);
        });
      });

      return () => {
        if (firstFrameId !== null) {
          cancelAnimationFrame(firstFrameId);
        }

        if (secondFrameId !== null) {
          cancelAnimationFrame(secondFrameId);
        }
      };
    }
  }, [error, hasAnalysis, loading, progress, resetAnalysisAnimation, startAnalysisAnimation]);

  // 다른 탭에서 분석 탭으로 다시 돌아올 때마다 결과 애니메이션을 다시 보여줍니다.
  useFocusEffect(
    useCallback(() => {
      if (!loading && !error && hasAnalysis && didRunInitialAnimationRef.current) {
        // 탭 전환 직후 화면 배치가 끝난 다음 애니메이션을 시작합니다.
        const frameId = requestAnimationFrame(() => {
          startAnalysisAnimation(2500);
        });

        return () => {
          cancelAnimationFrame(frameId);
        };
      }

      return undefined;
    }, [error, hasAnalysis, loading, startAnalysisAnimation]),
  );

  return {
    progress,
    angleAnimationKey,
  };
}
