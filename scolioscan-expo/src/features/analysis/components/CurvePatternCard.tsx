import { Text, View } from 'react-native';

import { getCurvePatternCopy } from '../analysisCopy';
import styles from '../styles/analysisCards.styles';
import type { DominantCurveInfo } from '../severity';
import CurvePatternIcon from '../../../../assets/icons/heroicons-outline_chart-bar.svg';

type CurvePatternCardProps = {
  dominantCurve: DominantCurveInfo;
};

export default function CurvePatternCard({ dominantCurve }: CurvePatternCardProps) {
  // 지배만곡 분류 결과를 사용자가 읽기 쉬운 곡선 패턴 설명으로 바꿔 표시합니다.
  const copy = getCurvePatternCopy(dominantCurve);

  return (
    <View style={styles.curvePatternCard}>
      <Text style={styles.curvePatternTitle}>곡선 패턴</Text>
      <View style={styles.curvePatternContent}>
        <View style={styles.curvePatternIconBox}>
          <CurvePatternIcon width={30} height={30} />
        </View>
        <View style={styles.curvePatternText}>
          <Text style={styles.curvePatternName}>{copy.title}</Text>
          <Text style={styles.curvePatternBody}>{copy.body}</Text>
        </View>
      </View>
    </View>
  );
}
