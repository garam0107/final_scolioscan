import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import styles from '@/src/features/settings/subscribe/subscribe.styles';

type CommonSubscribeHeaderProps = {
  title: string;
  onBack: () => void;
};

export default function CommonSubscribeHeader({ title, onBack }: CommonSubscribeHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable hitSlop={12} onPress={onBack} style={styles.headerIconButton}>
        <Ionicons name="chevron-back" size={24} color="#7E899F" />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSide} />
    </View>
  );
}
