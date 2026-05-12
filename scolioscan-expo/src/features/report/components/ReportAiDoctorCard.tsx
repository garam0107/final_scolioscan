import { Text, View } from 'react-native';

import type { CurvatureResponse } from '@/src/types/curvature';
import styles from '@/src/features/report/report.styles';
import PlayCircleIcon from '../../../../assets/icons/report/play_circle.svg';
import DangerHardIcon from '../../../../assets/icons/report/report_danger_hard.svg';
import DangerNormalIcon from '../../../../assets/icons/report/report_danger_noraml.svg';
import DangerSafeIcon from '../../../../assets/icons/report/report_danger_safe.svg';

type RiskLevel = 'normal' | 'moderate' | 'severe';

type ReportAiDoctorCardProps = {
  latestCurvature: CurvatureResponse | null;
};

const RISK_COPY: Record<RiskLevel, {
  label: string;
  labelStyle: object;
  Icon: typeof DangerSafeIcon;
  prognosis: string;
  brace: string;
  posture: string;
}> = {
  normal: {
    label: '정상',
    labelStyle: styles.aiRiskLabelNormal,
    Icon: DangerSafeIcon,
    prognosis: '현재 척추 상태가 양호합니다. 정기적인 자세 점검과 운동으로 건강을 유지하세요.',
    brace: '보조기 착용이 필요하지 않아요.',
    posture: '바른 자세 습관을 유지하고, 장시간 같은 자세를 피하세요.',
  },
  moderate: {
    label: '보통',
    labelStyle: styles.aiRiskLabelModerate,
    Icon: DangerNormalIcon,
    prognosis: '연 1회 정기 관찰을 권장해요. 일상에서 자세를 인식하고 바른 자세를 유지해주세요.',
    brace: '보스턴 보조기 등 TLSO를 하루 18~23시간 착용하시기를 권장드려요.',
    posture: '앉을 때 골반과 어깨 균형을 맞추고, 한쪽으로 기대는 습관을 줄여주세요.',
  },
  severe: {
    label: '위험',
    labelStyle: styles.aiRiskLabelSevere,
    Icon: DangerHardIcon,
    prognosis: '병원에서 의사와 상담 및 치료를 위한 수술 고려가 필요해요.',
    brace: '보조기 착용이나 추가 치료가 필요할 수 있어요. 전문의와 치료 방향을 상의하세요.',
    posture: '무리한 운동을 피하고, 통증이나 호흡 불편감이 있다면 즉시 의료진과 상담하세요.',
  },
};

const EXERCISES = [
  {
    title: '코어 강화 : 데드버그',
    detail: '양쪽 각 10회, 2세트',
  },
  {
    title: '스트레칭 : 흉추 회전',
    detail: '10회 반복, 2세트',
  },
  {
    title: '균형 운동 : 버드독',
    detail: '양쪽 각 10회, 2세트',
  },
];

function getRiskLevel(latestCurvature: CurvatureResponse | null): RiskLevel | null {
  // 세 부위 만곡 평균으로 AI 의견 카드의 위험 단계를 간단히 분류한다.
  if (!latestCurvature) return null;

  const average =
    (
      Math.abs(latestCurvature.secondary_thoracic_cobb) +
      Math.abs(latestCurvature.main_thoracic_cobb) +
      Math.abs(latestCurvature.lumbar_cobb)
    ) / 3;

  if (average < 15) return 'normal';
  if (average < 25) return 'moderate';
  return 'severe';
}

export default function ReportAiDoctorCard({ latestCurvature }: ReportAiDoctorCardProps) {
  const riskLevel = getRiskLevel(latestCurvature);
  // 측정 데이터가 없을 때는 기본 아이콘과 안내 문구를 보여준다.
  const copy = riskLevel ? RISK_COPY[riskLevel] : null;
  const RiskIcon = copy?.Icon ?? DangerSafeIcon;

  return (
    <View style={styles.aiDoctorCard}>
      <Text style={styles.aiDoctorTitle}>AI 의사 소견</Text>

      <View style={styles.aiRiskRow}>
        <View style={styles.aiRiskIconBox}>
          <RiskIcon width={28} height={28} />
        </View>
        <View style={styles.aiRiskTextWrap}>
          <Text style={styles.aiRiskTitle}>위험도 평가</Text>
          <Text style={[styles.aiRiskLabel, copy?.labelStyle]}>
            {copy?.label ?? '측정 데이터 없음'}
          </Text>
        </View>
      </View>

      <View style={styles.aiOpinionGroup}>
        <View style={styles.aiOpinionSection}>
          <Text style={styles.aiOpinionHeading}>예후</Text>
          <Text style={styles.aiOpinionBody}>
            {copy?.prognosis ?? '측정 결과가 쌓이면 AI 의사 소견을 확인할 수 있어요.'}
          </Text>
        </View>

        <View style={styles.aiOpinionSection}>
          <Text style={styles.aiOpinionHeading}>보조기 권장 사항</Text>
          <Text style={styles.aiOpinionBody}>
            {copy?.brace ?? '현재는 권장 사항을 판단할 측정 데이터가 부족해요.'}
          </Text>
        </View>

        <View style={[styles.aiOpinionSection, styles.aiOpinionSectionLast]}>
          <Text style={styles.aiOpinionHeading}>자세 및 인체 공학</Text>
          <Text style={styles.aiOpinionBody}>
            {copy?.posture ?? '바른 자세를 유지하고 정기적으로 측정해 주세요.'}
          </Text>
        </View>
      </View>

      <View style={styles.aiExerciseBlock}>
        <Text style={styles.aiExerciseTitle}>권장 운동</Text>
        <View style={styles.aiExerciseList}>
          {EXERCISES.map((exercise) => (
            <View key={exercise.title} style={styles.aiExerciseItem}>
              <View style={styles.aiExerciseThumb}>
                <PlayCircleIcon width={28} height={28} />
              </View>
              <View style={styles.aiExerciseTextWrap}>
                <Text style={styles.aiExerciseName}>{exercise.title}</Text>
                <Text style={styles.aiExerciseDetail}>{exercise.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
