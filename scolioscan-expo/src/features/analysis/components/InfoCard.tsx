import { i18n } from '@/src/i18n';
import { Linking, Pressable, Text, View } from 'react-native';

import { getInfoCardCopy, type InfoCardLevel } from '../analysisCopy';
import styles from '../styles/analysisCards.styles';

type InfoCardProps = {
  level: InfoCardLevel;
};

export default function InfoCard({ level }: InfoCardProps) {
  // 분석 등급에 맞는 안내 문구와 이미지를 한 곳에서 가져와 카드에 표시합니다.
  const copy = getInfoCardCopy(level);
  const InfoCardImageComponent = copy.ImageComponent;

  return (
    <View style={styles.infoCard}>
      <View style={styles.infoCardText}>
        <Text style={styles.infoCardTitle}>{i18n.t(copy.title)}</Text>
        <Text style={styles.infoCardBody}>{i18n.t(copy.body)}</Text>
        <Pressable onPress={() => Linking.openURL('http://www.ysbrpain.com/spinalClinic/scoliosis')}>
          <Text style={styles.infoCardLink}>{i18n.t("더 알아보기")}</Text>
        </Pressable>
      </View>

      <View style={styles.infoCardImageWrap}>
        <InfoCardImageComponent preserveAspectRatio="xMidYMid meet" />
      </View>
    </View>
  );
}
