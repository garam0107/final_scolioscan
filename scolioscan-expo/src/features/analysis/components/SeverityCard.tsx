import { Text, View } from 'react-native';

import styles from '../styles/analysisCards.styles';
import type { AnalysisPose } from '../analysisPose';
import { getRegionalSeverity, getSeverityBarPercent } from '../severity';
import { formatDegree, regionDisplayLabel } from '../utils/analysisFormat';

type SeverityCardProps = {
  metrics: AnalysisPose['metrics'];
};

export default function SeverityCard({ metrics }: SeverityCardProps) {
  return (
    <View style={styles.severityCard}>
      <Text style={styles.severityCardTitle}>심각도 분석</Text>

      <View style={styles.severityCardInner}>
        {metrics.map((metric, index) => {
          // 각 부위의 각도값을 같은 기준으로 등급, 배지, 진행 막대에 반영합니다.
          const severity = getRegionalSeverity(metric.value);
          const isLast = index === metrics.length - 1;

          return (
            <View key={metric.key} style={styles.severityRow}>
              <Text style={styles.severityRegionLabel}>
                {regionDisplayLabel(metric.key)}
              </Text>

              <View style={styles.severityValueRow}>
                <Text style={styles.severityCurvatureLabel}>만곡도</Text>
                <Text style={styles.severityValue}>{formatDegree(metric.value)}</Text>

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
                    {severity.label}
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
