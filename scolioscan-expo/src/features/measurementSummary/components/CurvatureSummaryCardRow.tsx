import { View, type StyleProp, type ViewStyle } from 'react-native';
import CurvatureSummaryCard from '@/src/features/measurementSummary/components/CurvatureSummaryCard';
import styles from '@/src/features/measurementSummary/measurementSummary.styles';
import type { CurvatureSummaryItem } from '@/src/features/measurementSummary/measurementSummaryTypes';

type CurvatureSummaryCardRowProps<Key extends string> = {
  items: CurvatureSummaryItem<Key>[];
  selectedKey: Key;
  onSelect: (key: Key) => void;
  style?: StyleProp<ViewStyle>;
};

export default function CurvatureSummaryCardRow<Key extends string>({
  items,
  selectedKey,
  onSelect,
  style,
}: CurvatureSummaryCardRowProps<Key>) {
  return (
    <View style={[styles.summaryRow, style]}>
      {items.map((item) => (
        <CurvatureSummaryCard
          key={item.key}
          label={item.label}
          value={item.value}
          selected={selectedKey === item.key}
          onPress={() => onSelect(item.key)}
        />
      ))}
    </View>
  );
}
