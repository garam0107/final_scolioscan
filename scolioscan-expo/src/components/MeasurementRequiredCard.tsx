import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import CameraImage from '../../assets/home/test.svg';
import { Colors } from '../constants/theme';

type MeasurementRequiredCardProps = {
  onPress?: () => void;
};

export default function MeasurementRequiredCard({ onPress }: MeasurementRequiredCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    router.replace('/home');
  };

  return (
    <View style={styles.card}>
      <CameraImage width={60} height={60} />

      <View style={styles.textWrap}>
        <Text style={styles.title}>먼저 측정을 해야해요!</Text>
        <Text style={styles.description}>
          분석을 위해선 먼저 측정을 해야해요
          {'\n'}
          아래 버튼을 눌러서 진행해주세요
        </Text>
      </View>

      <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={handlePress}>
        <Text style={styles.buttonText}>측정하러 가기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 264,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 32,
    gap: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 0.4,
  },
  textWrap: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: Colors.primary['500'],
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
  },
  description: {
    color: Colors.gray[600],
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
  },
  button: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary['500'],
    borderRadius: 6,
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: Colors.primary['white'],
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
