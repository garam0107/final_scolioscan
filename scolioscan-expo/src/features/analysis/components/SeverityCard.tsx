import { i18n } from '@/src/i18n';
import { BlurView } from 'expo-blur';
import { Linking, Platform, Pressable, Text, View } from 'react-native';

import styles from '../styles/analysisCards.styles';
import type { AnalysisPose } from '../analysisPose';
import { getRegionalSeverity, getSeverityBarPercent } from '../severity';
import { formatDegree, regionDisplayLabel } from '../utils/analysisFormat';

type SeverityCardProps = {
  metrics: AnalysisPose['metrics'];
  metricBlurMode: 'none' | 'rotation-only' | 'all';
};

const SEVERITY_REFERENCE_URL = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11297403/';

async function openSeverityReference() {
  try {
    // 심각도 분류 기준의 근거가 되는 참고문헌을 외부 브라우저에서 엽니다.
    await Linking.openURL(SEVERITY_REFERENCE_URL);
  } catch (error) {
    console.warn('[analysis] 참고문헌 링크 열기 실패', error);
  }
}

function BlurredSeverityValue({ value, blurred }: { value: string; blurred: boolean }) {
  if (!blurred) {
    return <Text style={styles.severityValue}>{value}</Text>;
  }

  if (Platform.OS !== 'ios') {
    return <Text style={[styles.severityValue, styles.severityValueBlurred]}>{value}</Text>;
  }

  return (
    <View style={styles.severityValueBlurWrapper}>
      <Text style={styles.severityValue}>{value}</Text>
      {/* iOS는 숫자 텍스트 위에 네이티브 블러를 겹쳐 Android와 같은 잠금 표시를 만든다. */}
      <BlurView
        intensity={64}
        tint="light"
        style={styles.severityValueBlurOverlay}
        pointerEvents="none"
      />
    </View>
  );
}

export default function SeverityCard({ metrics, metricBlurMode }: SeverityCardProps) {
  return (
    <View style={styles.severityCard}>
      <View style={styles.severityCardHeader}>
        <Text style={styles.severityCardTitle}>{i18n.t("심각도 분석")}</Text>
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={() => void openSeverityReference()}
        >
          <Text style={styles.severityReferenceLink}>{i18n.t("참고문헌")}</Text>
        </Pressable>
      </View>

      <View style={styles.severityCardInner}>
        {metrics.map((metric, index) => {
          // 각 부위의 각도값을 같은 기준으로 등급, 배지, 진행 막대에 반영합니다.
          const severity = getRegionalSeverity(metric.value);
          const isLast = index === metrics.length - 1;

          return (
            <View key={metric.key} style={styles.severityRow}>
              <Text style={styles.severityRegionLabel}>
                {i18n.t(regionDisplayLabel(metric.key))}
              </Text>

              <View style={styles.severityValueRow}>
                <Text style={styles.severityCurvatureLabel}>{i18n.t("만곡도")}</Text>
                <BlurredSeverityValue
                  value={formatDegree(metric.value)}
                  blurred={metricBlurMode === 'all'}
                />

                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: severity.badgeBackground },
                  ]}
                >
                  <Text
                    style={[
                      styles.severityBadgeText,
                      { color: severity.badgeTextColor },
                    ]}
                  >
                    {i18n.t(severity.label)}
                  </Text>
                </View>

                <View style={styles.severityBarWrap}>
                  <View
                    style={[
                      styles.severityTrack,
                      { backgroundColor: severity.trackColor },
                    ]}
                  >
                    <View
                      style={[
                        styles.severityFill,
                        {
                          width: `${getSeverityBarPercent(metric.value)}%`,
                          backgroundColor: severity.barColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {!isLast ? <View style={styles.severityDivider} /> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
