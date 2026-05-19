import { Pressable, Text, View } from 'react-native';

import styles from '@/src/features/settings/components/settingsTimeRow.styles';

export type SettingsTimeTarget = 'start' | 'end';

type SettingsTimeRowProps = {
  startHour: number;
  endHour: number;
  formatHourLabel: (hour: number) => string;
  onSelectTarget: (target: SettingsTimeTarget) => void;
};

export default function SettingsTimeRow({
  startHour,
  endHour,
  formatHourLabel,
  onSelectTarget,
}: SettingsTimeRowProps) {
  return (
    <View style={styles.timeRow}>
      <View style={styles.timeField}>
        <Text style={styles.timeLabel}>시작</Text>
        <Pressable
          style={({ pressed }) => [styles.timePill, pressed && styles.timePillPressed]}
          onPress={() => onSelectTarget('start')}
        >
          <Text numberOfLines={1} style={styles.timePillText}>{formatHourLabel(startHour)}</Text>
        </Pressable>
      </View>
      <Text style={styles.timeSeparator}>~</Text>
      <View style={styles.timeField}>
        <Text style={styles.timeLabel}>종료</Text>
        <Pressable
          style={({ pressed }) => [styles.timePill, pressed && styles.timePillPressed]}
          onPress={() => onSelectTarget('end')}
        >
          <Text numberOfLines={1} style={styles.timePillText}>{formatHourLabel(endHour)}</Text>
        </Pressable>
      </View>
    </View>
  );
}
