import { View } from 'react-native';

import styles from '../styles/analysisCards.styles';
import AnalysisSubImage from '../../../../assets/images/analysis_sub.svg';

export default function AiDoctorCard() {
  // AI 의사 안내 이미지는 고정 SVG라서 카드 렌더링만 별도 컴포넌트로 분리합니다.
  return (
    <View style={styles.aiDoctorSvgWrap}>
      <AnalysisSubImage width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />
    </View>
  );
}
