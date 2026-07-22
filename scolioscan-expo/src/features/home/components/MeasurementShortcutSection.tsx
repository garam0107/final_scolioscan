import { i18n } from '@/src/i18n';
import { View } from 'react-native';
import MeasurementCard, { type MeasurementItem } from '@/src/features/home/components/MeasurementCard';
import type { HomeMeasurementCardLayout } from '@/src/features/home/home.styles';
import styles from '@/src/features/home/styles/measurementShortcutSection.styles';

type MeasurementShortcutSectionProps = {
  items: MeasurementItem[];
  layout: HomeMeasurementCardLayout;
  onProPress: () => void;
};

export default function MeasurementShortcutSection({
  items,
  layout,
  onProPress,
}: MeasurementShortcutSectionProps) {
  return (
    <View style={[styles.measurementGrid, { height: layout.cardHeight }]}>
      {items.map((item) => (
        <MeasurementCard
          key={item.id}
          {...item}
          title={i18n.t(item.title)}
          subtitle={i18n.t(item.subtitle)}
          layout={layout}
          onPress={item.id === '3d' ? onProPress : item.onPress}
        />
      ))}
    </View>
  );
}
