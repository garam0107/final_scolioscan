import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

import { styles } from '../measure2d.styles';

type AutoGuideTone = 'info' | 'success' | 'warning' | 'error';

type AutoGuideStatusChipProps = {
  message: string | null;
  tone: AutoGuideTone;
  toastKey: number;
  bottomOffset: number;
  onDismiss: () => void;
};

export function AutoGuideStatusChip({ message, tone, toastKey, bottomOffset, onDismiss }: AutoGuideStatusChipProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-6)).current;

  const isSuccess = tone === 'success';
  const chipToneStyle = useMemo(() => {
    if (tone === 'error') return styles.autoGuideChipError;
    return null;
  }, [tone]);

  useEffect(() => {
    // 피그마 기준에 맞춰 자동 안내 칩은 표시 후 3초가 지나면 상태를 비운다.
    if (!message) {
      return undefined;
    }

    const timer = setTimeout(onDismiss, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, [message, onDismiss, toastKey]);

  useEffect(() => {
    // 자동 자세 안내는 화면 흐름을 끊지 않도록 토스트 대신 부드럽게 고정 표시한다.
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: message ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: message ? 0 : -6,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [message, opacity, translateY]);

  if (!message) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.autoGuideChip,
        chipToneStyle,
        {
          bottom: bottomOffset,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={[styles.autoGuideIcon, isSuccess ? styles.autoGuideSuccessIcon : styles.autoGuideInfoIcon]}>
        <Text
          style={[
            styles.autoGuideIconText,
            isSuccess ? styles.autoGuideSuccessIconText : styles.autoGuideInfoIconText,
          ]}
        >
          {isSuccess ? '✓' : 'i'}
        </Text>
      </View>
      <Text style={[styles.autoGuideChipText, isSuccess ? styles.autoGuideChipSuccessText : styles.autoGuideChipInfoText]}>
        {message}
      </Text>
    </Animated.View>
  );
}
