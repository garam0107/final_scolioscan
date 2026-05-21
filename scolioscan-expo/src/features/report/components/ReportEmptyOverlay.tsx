import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import styles from '@/src/features/report/report.styles';
import TwoDCamera from '../../../../assets/icons/2D_camera.svg';

type ReportEmptyOverlayProps = {
  onPress: () => void;
};

export default function ReportEmptyOverlay({ onPress }: ReportEmptyOverlayProps) {
  return (
    <View style={styles.emptyOverlay}>
      <BlurView intensity={110} tint="light" style={styles.blurView} pointerEvents="none" />
      <View style={styles.grayOverlay} pointerEvents="none" />
      <View style={styles.emptyContent}>
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyStateHeader}>
            <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
              <Defs>
                <LinearGradient id="emptyHeaderGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="18%" stopColor="#D6FFFE" />
                  <Stop offset="100%" stopColor="#FFFFFF" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#emptyHeaderGradient)" />
            </Svg>
            <TwoDCamera width={110} height={110} />
          </View>

          <View style={styles.emptyStateBody}>
            <Text style={styles.emptyStateTitle}>먼저 측정을 해야해요</Text>
            <Text style={styles.emptyStateMessage}>
              분석을 위해선 먼저 측정을 해야해요
              {'\n'}
              아래 버튼을 눌러서 진행해주세요
            </Text>
            {/* 측정 결과가 없을 때 홈 화면으로 이동해 새 측정을 시작한다. */}
            <Pressable style={styles.emptyStateButton} onPress={onPress}>
              <Text style={styles.emptyStateButtonText}>홈으로 돌아가기</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
