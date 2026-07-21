import { Pressable, Text, View } from 'react-native';

import styles from '../styles/analysisMeasurementActionCard.styles';

type AnalysisMeasurementActionCardProps = {
  subscribed: boolean;
  onPress: () => void;
};

export default function AnalysisMeasurementActionCard({
  subscribed,
  onPress,
}: AnalysisMeasurementActionCardProps) {
  const title = subscribed
    ? '비틀림 각도가 없어요.'
    : '구독하면 각 척추의 정확한 각도를 볼 수 있어요.';
  const description = subscribed
    ? '비틀림 각도를 측정하면 더욱 자세한 척추 결과를 확인할 수 있어요.'
    : '처음 구독하시면 50% 할인해드려요!';
  const buttonLabel = subscribed ? '측정하러 가기' : '구독하러 가기';

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={onPress}
      >
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}
