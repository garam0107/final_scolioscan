import { Ionicons } from '@expo/vector-icons';
import { Pressable, Switch, Text, View } from 'react-native';

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

  return (
    <Pressable
      disabled={!onPress && !hasSwitch}
      onPress={hasSwitch && toggleKey ? () => onToggle?.(toggleKey) : onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && styles.dangerText]}>{title}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      {hasSwitch && toggleKey ? (
        <Switch
          value={isOn}
          onValueChange={() => onToggle?.(toggleKey)}
          trackColor={{ false: '#D4D9E2', true: '#2C9696' }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#D4D9E2"
        />
      ) : (
        <View style={styles.rowMeta}>
          {value ? <Text style={styles.rowValue}>{value}</Text> : null}
          {onPress ? <Ionicons name="chevron-forward" size={16} color="#B9C1CC" /> : null}
        </View>
      )}
    </Pressable>
  );
}
