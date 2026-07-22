import { i18n } from '@/src/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import styles from '@/src/features/settings/components/settingRow.styles';

export type SettingsToggleKey =
  | 'cellular'
  | 'nightMode'
  | 'importantAlarm'
  | 'otherAlarm'
  | 'marketing'
  | 'cloudBackup';

type SettingRowProps = {
  title: string;
  description?: string;
  value?: string;
  danger?: boolean;
  onPress?: () => void;
  toggleKey?: SettingsToggleKey;
  toggles?: Record<SettingsToggleKey, boolean>;
  onToggle?: (key: SettingsToggleKey) => void;
};

export default function SettingRow({
  title,
  description,
  value,
  danger = false,
  onPress,
  toggleKey,
  toggles,
  onToggle,
}: SettingRowProps) {
  // 같은 행 컴포넌트에서 스위치형 설정과 이동형 설정을 함께 처리한다.
  const hasSwitch = Boolean(toggleKey && toggles && onToggle);
  const isOn = toggleKey ? toggles?.[toggleKey] : false;
  const switchProgress = useRef(new Animated.Value(isOn ? 1 : 0)).current;

  useEffect(() => {
    // 기본 Switch와 같은 느낌으로 상태 변경 시 thumb 위치와 track 색상을 함께 보간한다.
    Animated.timing(switchProgress, {
      duration: 180,
      toValue: isOn ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }, [isOn, switchProgress]);

  const trackBackgroundColor = switchProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#D4D9E2', '#2C9696'],
  });

  const thumbTranslateX = switchProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 16],
  });

  return (
    <Pressable
      disabled={!onPress && !hasSwitch}
      onPress={hasSwitch && toggleKey ? () => onToggle?.(toggleKey) : onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && styles.dangerText]}>{i18n.t(title)}</Text>
        {description ? <Text style={styles.rowDescription}>{i18n.t(description)}</Text> : null}
      </View>
      {hasSwitch && toggleKey ? (
        <Animated.View
          accessibilityRole="switch"
          accessibilityState={{ checked: isOn }}
          pointerEvents="none"
          style={[styles.switchTrack, { backgroundColor: trackBackgroundColor }]}
        >
          <Animated.View
            style={[
              styles.switchThumb,
              {
                transform: [{ translateX: thumbTranslateX }],
              },
            ]}
          />
        </Animated.View>
      ) : (
        <View style={styles.rowMeta}>
          {value ? <Text style={styles.rowValue}>{value}</Text> : null}
          {onPress ? <Ionicons name="chevron-forward" size={16} color="#B9C1CC" /> : null}
        </View>
      )}
    </Pressable>
  );
}
