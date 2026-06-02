import { Pressable, Text } from 'react-native';
import styles from '@/src/features/measurementSummary/measurementSummary.styles';

type CurvatureSummaryCardProps = {
  label: string;
  value: string;
  selected: boolean;
  onPress: () => void;
};

export default function CurvatureSummaryCard({
  label,
  value,
  selected,
  onPress,
}: CurvatureSummaryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.summaryCard,
        selected ? styles.summaryCardActive : null,
        pressed && { opacity: 0.92 },
      ]}
    >
      <Text style={[styles.summaryLabel, selected ? styles.summaryLabelActive : null]}>{label}</Text>
      <Text style={[styles.summaryValue, selected ? styles.summaryValueActive : null]}>{value}</Text>
    </Pressable>
  );
}
