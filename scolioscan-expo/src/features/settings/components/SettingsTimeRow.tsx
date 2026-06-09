import { Pressable, Text, View } from 'react-native';

import styles from '@/src/features/settings/components/settingsTimeRow.styles';

type SettingsTimeRowProps = {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  formatTimeLabel: (hour: number, minute: number) => string;
  onPress: () => void;
};

export default function SettingsTimeRow({
  startHour,
  startMinute,
  endHour,
  endMinute,
  formatTimeLabel,
  onPress,
}: SettingsTimeRowProps) {
  return (
    <View style={styles.timeRow}>
      <Pressable
        style={({ pressed }) => [styles.timeField, pressed && styles.timePillPressed]}
        onPress={onPress}
      >
        <Text style={styles.timeLabel}>시작</Text>
        <View style={styles.timePill}>
          <Text numberOfLines={1} style={styles.timePillText}>
            {formatTimeLabel(startHour, startMinute)}
          </Text>
        </View>
      </Pressable>
      <Text style={styles.timeSeparator}>~</Text>
      <Pressable
        style={({ pressed }) => [styles.timeField, pressed && styles.timePillPressed]}
        onPress={onPress}
      >
        <Text style={styles.timeLabel}>종료</Text>
        <View style={styles.timePill}>
          <Text numberOfLines={1} style={styles.timePillText}>
            {formatTimeLabel(endHour, endMinute)}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
