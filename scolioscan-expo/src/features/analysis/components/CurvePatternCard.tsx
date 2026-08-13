import { i18n } from '@/src/i18n';
import { Linking, Pressable, Text, View } from 'react-native';

import { getCurvePatternCopy } from '../analysisCopy';
import styles from '../styles/analysisCards.styles';
import type { DominantCurveInfo } from '../severity';
import CurvePatternIcon from '../../../../assets/icons/heroicons-outline_chart-bar.svg';

type CurvePatternCardProps = {
  dominantCurve: DominantCurveInfo;
};

const CURVE_PATTERN_REFERENCE_URL = 'https://www.srs.org/Patients/Resources/Glossary-of-Terms';

async function openCurvePatternReference() {
  try {
    // 곡선 패턴 설명의 공식 근거 문서를 외부 브라우저에서 엽니다.
    await Linking.openURL(CURVE_PATTERN_REFERENCE_URL);
  } catch (error) {
    console.warn('[analysis] 곡선 패턴 참고문헌 링크 열기 실패', error);
  }
}

export default function CurvePatternCard({ dominantCurve }: CurvePatternCardProps) {
  // 지배만곡 분류 결과를 사용자가 읽기 쉬운 곡선 패턴 설명으로 바꿔 표시합니다.
  const copy = getCurvePatternCopy(dominantCurve);

  return (
    <View style={styles.curvePatternCard}>
      <View style={styles.curvePatternHeader}>
        <Text style={styles.curvePatternTitle}>{i18n.t("곡선 패턴")}</Text>
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={() => void openCurvePatternReference()}
        >
          <Text style={styles.curvePatternReferenceLink}>{i18n.t("참고문헌")}</Text>
        </Pressable>
      </View>
      <View style={styles.curvePatternContent}>
        <View style={styles.curvePatternIconBox}>
          <CurvePatternIcon width={30} height={30} />
        </View>
        <View style={styles.curvePatternText}>
          <Text style={styles.curvePatternName}>{i18n.t(copy.title)}</Text>
          <Text style={styles.curvePatternBody}>{i18n.t(copy.body)}</Text>
        </View>
      </View>
    </View>
  );
}
