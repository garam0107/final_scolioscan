import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastTone = 'info' | 'success' | 'warning' | 'error';

type ToastAlertProps = {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  tone?: ToastTone;
  durationMs?: number;
  toastKey?: string | number;
};

const TONE_STYLES: Record<ToastTone, { backgroundColor: string; borderColor: string; icon: keyof typeof Ionicons.glyphMap }> = {
  info: {
    backgroundColor: '#2C9696',
    borderColor: '#2C9696',
    icon: 'information-circle-outline',
  },
  success: {
    backgroundColor: '#2C9696',
    borderColor: '#2C9696',
    icon: 'checkmark-circle-outline',
  },
  warning: {
    backgroundColor: '#D9A441',
    borderColor: '#C99224',
    icon: 'alert-circle-outline',
  },
  error: {
    backgroundColor: '#E05A5A',
    borderColor: '#D94B4B',
    icon: 'alert-circle-outline',
  },
};

export default function ToastAlert({
  visible,
  message,
  onDismiss,
  tone = 'info',
  durationMs = 2200,
  toastKey,
}: ToastAlertProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    if (!visible || !message) {
      opacity.setValue(0);
      translateY.setValue(-10);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      onDismiss();
    }, durationMs);

    return () => {
      clearTimeout(timer);
    };
  }, [durationMs, message, onDismiss, opacity, toastKey, translateY, visible]);

  if (!visible || !message) {
    return null;
  }

  const toneStyle = TONE_STYLES[tone];

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          // 토스트 위치 조절
          top: insets.top + 280,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: toneStyle.backgroundColor,
            borderColor: toneStyle.borderColor,
          },
        ]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name={toneStyle.icon} size={16} color="#FFFFFF" />
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
      <Pressable onPress={onDismiss} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    left: 0,
    paddingHorizontal: 16,
    position: 'absolute',
    right: 0,
    zIndex: 999,
  },
  toast: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    maxWidth: 360,
    minHeight: 32,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  iconWrap: {
    marginRight: 8,
  },
  message: {
    color: '#FFFFFF',
    flexShrink: 1,
    fontFamily: 'PretendardVariable',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
