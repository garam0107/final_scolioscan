import { i18n } from '@/src/i18n';
import { Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import { Colors } from '@/src/constants/theme';
import styles from '@/src/features/measurementSummary/measurementSummary.styles';
import {
  CURVATURE_TREND_CHART_HEIGHT,
  CURVATURE_TREND_CHART_MAX_VALUE,
} from '@/src/features/measurementSummary/measurementSummaryTypes';

type CurvatureTrendChartProps = {
  chartWidth: number;
  averageChangeText: string;
  recentChangeText: string;
  trendPath: string;
  trendAreaPath: string;
  xAxisLabels: string[];
  gradientId: string;
  hasData?: boolean;
  emptyText?: string;
};

function getThresholdY(value: number) {
  return CURVATURE_TREND_CHART_HEIGHT
    - (value / CURVATURE_TREND_CHART_MAX_VALUE) * CURVATURE_TREND_CHART_HEIGHT;
}

export default function CurvatureTrendChart({
  chartWidth,
  averageChangeText,
  recentChangeText,
  trendPath,
  trendAreaPath,
  xAxisLabels,
  gradientId,
  hasData = true,
  emptyText,
}: CurvatureTrendChartProps) {
  const showEmptyState = !hasData && Boolean(emptyText);

  return (
    <View style={styles.trendCard}>
      <View style={styles.trendHeader}>
        <View style={styles.trendSummary}>
          <Text style={styles.trendTitle}>{i18n.t("평균 변화량")}</Text>
          <View style={styles.trendValueRow}>
            <Text style={styles.trendValue}>{averageChangeText}</Text>
            <View style={styles.trendBadge}>
              <Text style={styles.trendBadgeText}>{i18n.t("최근 변화")}{recentChangeText}</Text>
            </View>
          </View>
        </View>

        <View style={styles.trendLegend}>
          <View style={styles.trendLegendRow}>
            <View style={[styles.trendLegendLine, styles.trendLegendDanger]} />
            <Text style={[styles.trendLegendText, styles.trendLegendDangerText]}>{i18n.t("위험")}</Text>
          </View>
          <View style={styles.trendLegendRow}>
            <View style={[styles.trendLegendLine, styles.trendLegendWarning]} />
            <Text style={[styles.trendLegendText, styles.trendLegendWarningText]}>{i18n.t("보통")}</Text>
          </View>
          <View style={styles.trendLegendRow}>
            <View style={[styles.trendLegendLine, styles.trendLegendNormal]} />
            <Text style={[styles.trendLegendText, styles.trendLegendNormalText]}>{i18n.t("정상")}</Text>
          </View>
        </View>
      </View>

      {showEmptyState ? (
        <View style={styles.trendEmptyState}>
          <Text style={styles.trendEmptyText}>{emptyText}</Text>
        </View>
      ) : (
        <View style={styles.trendChartWrap}>
          <Svg width={chartWidth} height={CURVATURE_TREND_CHART_HEIGHT}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={Colors.blue[500]} stopOpacity={0.16} />
                <Stop offset="100%" stopColor={Colors.blue[500]} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Line x1="0" y1={getThresholdY(40)} x2={chartWidth} y2={getThresholdY(40)} stroke={Colors.red[400]} strokeWidth={1} strokeDasharray="6 6" />
            <Line x1="0" y1={getThresholdY(25)} x2={chartWidth} y2={getThresholdY(25)} stroke={Colors.yellow[300]} strokeWidth={1} strokeDasharray="6 6" />
            <Line x1="0" y1={getThresholdY(10)} x2={chartWidth} y2={getThresholdY(10)} stroke={Colors.mint[500]} strokeWidth={1} strokeDasharray="6 6" />
            {trendPath ? (
              <>
                <Path d={trendAreaPath} fill={`url(#${gradientId})`} />
                <Path
                  d={trendPath}
                  fill="none"
                  stroke={Colors.blue[500]}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : null}
          </Svg>
        </View>
      )}

      <View style={styles.trendXAxis}>
        {xAxisLabels.map((label, index) => (
          <Text
            key={label}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={[
              styles.trendXAxisText,
              i18n.language.startsWith('en') ? styles.trendXAxisTextEnglish : null,
              index === 0 ? styles.trendXAxisTextStart : null,
              index === xAxisLabels.length - 1 ? styles.trendXAxisTextEnd : null,
            ]}
          >
            {i18n.t(label)}
          </Text>
        ))}
      </View>
    </View>
  );
}
