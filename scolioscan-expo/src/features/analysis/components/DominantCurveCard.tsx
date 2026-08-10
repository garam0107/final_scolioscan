import { i18n } from '@/src/i18n';
import { Linking, Pressable, Text, View } from 'react-native';

import styles from '../styles/analysisCards.styles';
import type { DominantCurveInfo } from '../severity';
import VertebraeType from '../../../../assets/images/analysis/analysis_type_normal.svg';
import VertebraeDoubleMajor from '../../../../assets/images/analysis/Double_major.svg';
import VertebraeDoubleThoracic from '../../../../assets/images/analysis/Double_Thoracic.svg';
import VertebraeLumbar from '../../../../assets/images/analysis/Lumbar.svg';
import VertebraeThoracic from '../../../../assets/images/analysis/Thoracic.svg';
import VertebraeTripleCurve from '../../../../assets/images/analysis/Triple_curve.svg';

type DominantCurveCardProps = {
  dominantCurve: DominantCurveInfo;
  summaryName: string;
  isWideLayout: boolean;
  wideStageScale: number;
};

function getDominantCurveImageComponent(dominantCurve: DominantCurveInfo) {
  // 서버가 내려준 back_type 또는 로컬 분류 결과에 맞는 척추 유형 이미지를 고릅니다.
  switch (dominantCurve.key) {
    case 'Thoracic':
      return VertebraeThoracic;
    case 'Double Thoracic':
      return VertebraeDoubleThoracic;
    case 'Double major':
      return VertebraeDoubleMajor;
    case 'Triple curve':
      return VertebraeTripleCurve;
    case 'Lumbar':
      return VertebraeLumbar;
    case 'Normal':
    case 'Unknown':
      return VertebraeType;
  }
}

export default function DominantCurveCard({
  dominantCurve,
  summaryName,
  isWideLayout,
  wideStageScale,
}: DominantCurveCardProps) {
  const DominantCurveImageComponent = getDominantCurveImageComponent(dominantCurve);

  return (
    <View
      style={[
        styles.dominantCurveCard,
        isWideLayout
          ? {
              minHeight: 136 * wideStageScale,
              paddingLeft: 14 * wideStageScale,
              paddingRight: 10 * wideStageScale,
              paddingVertical: 8 * wideStageScale,
            }
          : null,
      ]}
    >
      <View style={styles.dominantCurveText}>
        <Text style={styles.dominantCurveTitle}>{i18n.t("척추 만곡 유형")}</Text>

        <Text style={styles.dominantCurveBody}>
          {summaryName}{i18n.t("님의 척추 만곡 유형은")}{'\n'}
          <Text style={styles.dominantCurveDiagnosis}>
            {i18n.t(dominantCurve.diagnosisName)}
          </Text>{' '}
          {i18n.t('으로 예상됩니다.')}
        </Text>

        <Pressable onPress={() => Linking.openURL('http://www.ysbrpain.com/spinalClinic/scoliosis')}>
          <Text style={styles.dominantCurveLink}>{i18n.t("더 알아보기")}</Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.dominantCurveImageWrap,
          isWideLayout
            ? {
                width: 120 * wideStageScale,
                height: 140 * wideStageScale,
                marginRight: -14 * wideStageScale,
              }
            : null,
        ]}
      >
        <DominantCurveImageComponent preserveAspectRatio="xMidYMid meet" />
      </View>
    </View>
  );
}
