import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Colors } from '@/src/constants/theme';

type TopScrollGradientProps = {
  visible: boolean;
  color?: string;
  height?: number;
};

export function useTopScrollGradient(threshold = 4) {
  const [visible, setVisible] = useState(false);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextVisible = event.nativeEvent.contentOffset.y > threshold;
    setVisible((current) => (current === nextVisible ? current : nextVisible));
  }, [threshold]);

  return { visible, onScroll };
}

export default function TopScrollGradient({
  visible,
  color = Colors.mint[50],
  height = 28,
}: TopScrollGradientProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 140,
      useNativeDriver: true,
    }).start();
  }, [opacity, visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          top: insets.top,
          height,
          opacity,
        },
      ]}
    >
      {/* 스크롤된 내용이 상단바 아래로 붙어 보이지 않도록 상태바 하단에만 얇은 보호 그라데이션을 표시한다. */}
      <Svg width="100%" height="100%" viewBox="0 0 100 28" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="topScrollGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.95} />
            <Stop offset="55%" stopColor={color} stopOpacity={0.62} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="28" fill="url(#topScrollGradient)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
    elevation: 30,
  },
});
