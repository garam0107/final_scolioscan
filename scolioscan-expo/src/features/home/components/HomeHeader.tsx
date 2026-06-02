import { Pressable, Text, View } from 'react-native';
import { HomeNotificationIcon } from '@/src/features/home/homeIcons';
import styles from '@/src/features/home/styles/homeHeader.styles';

type HomeHeaderProps = {
  alarmCount: number;
  showFontWarning: boolean;
  onNotificationPress: () => void;
};

export default function HomeHeader({
  alarmCount,
  showFontWarning,
  onNotificationPress,
}: HomeHeaderProps) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.brand}>ScolioScan</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={onNotificationPress} style={styles.headerIconButton}>
            <HomeNotificationIcon unread={alarmCount > 0} />
          </Pressable>
        </View>
      </View>

      {showFontWarning ? (
        <View style={styles.fontWarning}>
          <Text style={styles.fontWarningText}>
            폰트 로딩 실패: 기본 시스템 폰트로 표시 중입니다.
          </Text>
        </View>
      ) : null}

    </>
  );
}
