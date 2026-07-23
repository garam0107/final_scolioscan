import { i18n } from '@/src/i18n';
import { Pressable, Text, View } from 'react-native';

import styles from '@/src/features/home/styles/homeHeader.styles';

type HomeHeaderProps = {
  showFontWarning: boolean;
};

export default function HomeHeader({
  showFontWarning,
}: HomeHeaderProps) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.brand}>ScolioScan</Text>
        <View style={styles.headerActions}>
    
        </View>
      </View>

      {showFontWarning ? (
        <View style={styles.fontWarning}>
          <Text style={styles.fontWarningText}>{i18n.t("폰트 로딩 실패: 기본 시스템 폰트로 표시 중입니다.")}</Text>
        </View>
      ) : null}

    </>
  );
}
