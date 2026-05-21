import { Pressable, Text } from 'react-native';
import styles from '@/src/features/report/report.styles';

type ReportSummaryCardProps = {
  label: string;
  value: string;
  selected: boolean;
  onPress: () => void;
};

export default function ReportSummaryCard({
  label,
  value,
  selected,
  onPress,
}: ReportSummaryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.summaryCard,
        selected ? styles.summaryCardActive : null,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.summaryLabel, selected ? styles.summaryLabelActive : null]}>{label}</Text>
      <Text style={[styles.summaryValue, selected ? styles.summaryValueActive : null]}>{value}</Text>
    </Pressable>
  );
}
