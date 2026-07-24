import { i18n } from '@/src/i18n';
import { Pressable, Text, View } from 'react-native';

import styles from '@/src/features/settings/components/settingsTimeRow.styles';

type SettingsTimeRowProps = {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  formatTimeLabel: (hour: number, minute: number) => string;
  onPress: () => void;
  isToggled : boolean;
};

export default function SettingsTimeRow({
  startHour,
  startMinute,
  endHour,
  endMinute,
  formatTimeLabel,
  onPress,
  isToggled
}: SettingsTimeRowProps) {

   const stateColors = isToggled
    ? {
        label: styles.toggleTimeLabel,
        pill: styles.toggleTimePill,
        text: styles.toggleText,
        separator: styles.toggleTimeSeparator,
      }
    : {
        label: styles.notToggleTimeLabel,
        pill: styles.notToggleTimePill,
        text: styles.notToggleText,
        separator: styles.notToggleTimeSeparator,
      };
 return (
    <View style={styles.timeRow}>
      <Pressable
        disabled={!isToggled}
        style={({ pressed }) => [
          styles.timeField,
          pressed && styles.timePillPressed,
        ]}
        onPress={onPress}
      >
        <Text style={[styles.timeLabel, stateColors.label]}>
          {i18n.t('시작')}
        </Text>

        <View style={[styles.timePill, stateColors.pill]}>
          <Text numberOfLines={1} style={[styles.timePillText, stateColors.text]}>
            {formatTimeLabel(startHour, startMinute)}
          </Text>
        </View>
      </Pressable>

      <Text style={[styles.timeSeparator, stateColors.separator]}>
        ~
      </Text>

      <Pressable
        disabled={!isToggled}
        style={({ pressed }) => [
          styles.timeField,
          pressed && styles.timePillPressed,
        ]}
        onPress={onPress}
      >
        <Text style={[styles.timeLabel, stateColors.label]}>
          {i18n.t('종료')}
        </Text>

        <View style={[styles.timePill, stateColors.pill]}>
          <Text numberOfLines={1} style={[styles.timePillText, stateColors.text]}>
            {formatTimeLabel(endHour, endMinute)}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
