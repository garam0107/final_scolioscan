import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Line,
  Path,
  Polygon,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { curvatureAPI } from '@/src/api/curvature';
import { rotationAPI } from '@/src/api/rotation';
import type { CurvatureResponse } from '@/src/types/curvature';
import type { RotationResponse } from '@/src/types/rotation';
import styles from '@/src/features/report/report.styles';
import MyRectangle from '../../../assets/icons/my_rectangle.svg';
import KoreanRectangle from '../../../assets/icons/korean_rectangle.svg';
import TwoDCamera from '../../../assets/icons/2D_camera.svg';

type FilterKey = 'all' | '2d' | 'scoliometer' | '3d';
type MeasurementSource = 'curvature' | 'rotation';
type TrendAngleKey = 'proximal' | 'main' | 'lumbar';
type TrendPeriodKey = 'week1' | 'week2' | 'month1' | 'month3' | 'month6' | 'year1';

type ReportMetric = {
  label: string;
  value: number | null;
};

type ReportListItem = {
  id: string;
  source: MeasurementSource;
  createdAt: string;
  category: Exclude<FilterKey, 'all'>;
  badgeLabel: string;
  metrics: [ReportMetric, ReportMetric, ReportMetric];
  navigationId?: string;
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: '2d', label: '2D' },
  { key: 'scoliometer', label: '척추측만계' },
  { key: '3d', label: '3D' },
];

const CURVATURE_METRIC_LABELS = [
  '상부 흉추만곡',
  '주 흉추만곡',
  '요추만곡',
] as const;

const ROTATION_METRIC_LABELS = [
  '상부 흉추만곡',
  '주 흉추만곡',
  '요추만곡',
] as const;

const TREND_ANGLE_OPTIONS: {
  key: TrendAngleKey;
  label: string;
  displayLabel: string;
  field: keyof Pick<
    CurvatureResponse,
    'secondary_thoracic_cobb' | 'main_thoracic_cobb' | 'lumbar_cobb'
  >;
}[] = [
  {
    key: 'proximal',
    label: '상부 흉추',
    displayLabel: '상부 흉추만곡',
    field: 'secondary_thoracic_cobb',
  },
  {
    key: 'main',
    label: '주 흉추',
    displayLabel: '주 흉추만곡',
    field: 'main_thoracic_cobb',
  },
  {
    key: 'lumbar',
    label: '요추',
    displayLabel: '요추만곡',
    field: 'lumbar_cobb',
  },
];

const TREND_PERIOD_OPTIONS: { key: TrendPeriodKey; label: string; days: number }[] = [
  { key: 'week1', label: '1주일', days: 7 },
  { key: 'week2', label: '2주일', days: 14 },
  { key: 'month1', label: '1개월', days: 30 },
  { key: 'month3', label: '3개월', days: 90 },
  { key: 'month6', label: '6개월', days: 180 },
  { key: 'year1', label: '1년', days: 365 },
];
const TREND_CHART_HEIGHT = 120;
const TREND_CHART_MAX_VALUE = 40;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatDegree(value?: number | null) {
  if (value === null || value === undefined) return '-';
  return `${Math.abs(value).toFixed(1)}°`;
}

function formatRoundedDegree(value?: number | null) {
  if (value === null || value === undefined) return '-';
  return `${Math.round(Math.abs(value))}°`;
}

function getMeasurementDate(
  record: Pick<CurvatureResponse, 'measured_at' | 'created_at'> | Pick<RotationResponse, 'measured_at' | 'created_at'>,
) {
  return record.measured_at || record.created_at;
}

function toCurvatureListItem(record: CurvatureResponse): ReportListItem {
  const createdAt = getMeasurementDate(record);

  return {
    id: `curvature-${record.id}`,
    source: 'curvature',
    createdAt,
    category: '2d',
    badgeLabel: '2D 카메라촬영',
    navigationId: String(record.id),
    metrics: [
      { label: CURVATURE_METRIC_LABELS[0], value: record.secondary_thoracic_cobb },
      { label: CURVATURE_METRIC_LABELS[1], value: record.main_thoracic_cobb },
      { label: CURVATURE_METRIC_LABELS[2], value: record.lumbar_cobb },
    ],
  };
}

function toRotationListItem(record: RotationResponse): ReportListItem {
  const createdAt = getMeasurementDate(record);

  return {
    id: `rotation-${record.id}`,
    source: 'rotation',
    createdAt,
    category: 'scoliometer',
    navigationId: String(record.id),
    badgeLabel: '척추측만계 측정',
    metrics: [
      { label: ROTATION_METRIC_LABELS[0], value: record.upper_thoracic_atr },
      { label: ROTATION_METRIC_LABELS[1], value: record.thoracic_atr },
      { label: ROTATION_METRIC_LABELS[2], value: record.lumbar_atr },
    ],
  };
}

function getTrendValue(record: CurvatureResponse | undefined, key: TrendAngleKey) {
  const option = TREND_ANGLE_OPTIONS.find((item) => item.key === key) ?? TREND_ANGLE_OPTIONS[1];
  return Math.abs(Number(record?.[option.field]) || 0);
}

function formatAngleValue(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 10) / 10;
}

function formatChangeAngle(value: number, showPlus = false) {
  const angle = formatAngleValue(Math.abs(value));
  const sign = showPlus && angle > 0 ? '+' : '';

  return `${sign}${angle}°`;
}

function getPeriodOption(period: TrendPeriodKey) {
  return TREND_PERIOD_OPTIONS.find((item) => item.key === period) ?? TREND_PERIOD_OPTIONS[2];
}

function buildTrendPath(values: number[], chartWidth: number) {
  if (values.length === 0 || chartWidth <= 0) {
    return '';
  }

  if (values.length === 1) {
    const y = TREND_CHART_HEIGHT - (Math.min(values[0], TREND_CHART_MAX_VALUE) / TREND_CHART_MAX_VALUE) * TREND_CHART_HEIGHT;
    return `M 0 ${y} L ${chartWidth} ${y}`;
  }

  const points = values.map((value, index) => {
    const x = (chartWidth / (values.length - 1)) * index;
    const safeValue = Math.max(0, Math.min(value, TREND_CHART_MAX_VALUE));
    const y = TREND_CHART_HEIGHT - (safeValue / TREND_CHART_MAX_VALUE) * TREND_CHART_HEIGHT;

    return { x, y };
  });
  const path = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const previous = points[index - 1] ?? current;
    const afterNext = points[index + 2] ?? next;

    const cp1x = current.x + (next.x - previous.x) / 6;
    const cp1y = current.y + (next.y - previous.y) / 6;
    const cp2x = next.x - (afterNext.x - current.x) / 6;
    const cp2y = next.y - (afterNext.y - current.y) / 6;

    path.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${next.x} ${next.y}`);
  }

  return path.join(' ');
}

function getThresholdY(value: number) {
  return TREND_CHART_HEIGHT - (value / TREND_CHART_MAX_VALUE) * TREND_CHART_HEIGHT;
}

function getTrendAxisLabels(period: TrendPeriodKey) {
  if (period === 'week1') return ['6일 전', '4일 전', '2일 전', '어제', '오늘'];
  if (period === 'week2') return ['2주 전', '10일 전', '1주 전', '3일 전', '오늘'];
  if (period === 'year1') return ['1년 전', '9개월 전', '6개월 전', '3개월 전', '오늘'];

  const monthLabels: Record<TrendPeriodKey, string[]> = {
    week1: [],
    week2: [],
    month1: ['한 달 전', '3주 전', '2주 전', '1주 전', '오늘'],
    month3: ['3개월 전', '2개월 전', '1개월 전', '2주 전', '오늘'],
    month6: ['6개월 전', '4개월 전', '2개월 전', '1개월 전', '오늘'],
    year1: [],
  };

  return monthLabels[period];
}

function TriangleChart({
  myValues,
  avgValues,
  labels,
  myMeasurementLabel,
  avgLabel,
  chartDescriptionText,
}: {
  myValues: [number, number, number];
  avgValues: [number, number, number];
  labels: [string, string, string];
  myMeasurementLabel: string;
  avgLabel: string;
  chartDescriptionText: string;
}) {
  const size = 320;
  const padding = 25;
  const chartSize = size - padding * 2;
  const centerX = size / 2;
  const centerY = size / 2 + 12;
  const maxRadius = chartSize * 0.52;
  const maxAngle = 45;
  const gridAngles = [15, 30, 45];

  const getPoint = (index: number, value: number) => {
    const angle = (index * 120 - 90) * (Math.PI / 180);
    const radius = (Math.min(value, maxAngle) / maxAngle) * maxRadius;

    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const createPath = (values: [number, number, number]) => {
    const points = values.map((value, index) => getPoint(index, value));

    return (
      points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ') + ' Z'
    );
  };

  const getLabelPosition = (index: number) => {
    const angle = (index * 120 - 90) * (Math.PI / 180);
    const labelRadius = index === 0 ? maxRadius + 6 : maxRadius + 24;

    return {
      x: centerX + labelRadius * Math.cos(angle),
      y: centerY + labelRadius * Math.sin(angle),
    };
  };

  const getGridLabelPosition = (gridValue: number) => {
    const angle = (2 * 120 - 90) * (Math.PI / 180);
    const radius = (gridValue / maxAngle) * maxRadius;

    return {
      x: centerX + radius * Math.cos(angle) - 14,
      y: centerY + radius * Math.sin(angle) + 5,
    };
  };

  const svgHeight = size - 14;

  return (
    <View style={styles.chartWrap}>
      <Svg width={size} height={svgHeight} viewBox={`0 0 ${size} ${svgHeight}`} style={styles.chartSvg}>
        {gridAngles.map((value) => (
          <Polygon
            key={value}
            points={[0, 1, 2]
              .map((index) => {
                const point = getPoint(index, value);
                return `${point.x},${point.y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={1}
          />
        ))}

        {[0, 1, 2].map((index) => {
          const point = getPoint(index, maxAngle);

          return (
            <Line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={point.x}
              y2={point.y}
              stroke="#E5E7EB"
              strokeWidth={1}
            />
          );
        })}

        {gridAngles.map((value) => {
          const position = getGridLabelPosition(value);

          return (
            <SvgText key={value} x={position.x} y={position.y} textAnchor="middle" fontSize="10" fill="#9CA3AF">
              {value}°
            </SvgText>
          );
        })}

        <Path
          d={createPath(avgValues)}
          fill="rgba(156, 163, 175, 0.18)"
          stroke="#9CA3AF"
          strokeWidth={2}
          strokeDasharray="4 4"
        />

        <Path
          d={createPath(myValues)}
          fill="rgba(215, 249, 249, 0.65)"
          stroke="#2C9696"
          strokeWidth={1}
        />

        {myValues.map((value, index) => {
          const point = getPoint(index, value);
          const textOffset =
            index === 0
              ? { x: 0, y: -12, anchor: 'middle' as const }
              : index === 1
                ? { x: 10, y: 10, anchor: 'start' as const }
                : { x: -10, y: 10, anchor: 'end' as const };

          return (
            <G key={index}>
              <Circle cx={point.x} cy={point.y} r={3} fill="#2C9696" />
              <SvgText
                x={point.x + textOffset.x}
                y={point.y + textOffset.y}
                textAnchor={textOffset.anchor}
                fontSize="11"
                fontWeight="700"
                fill="#2C9696"
              >
      
              </SvgText>
            </G>
          );
        })}

        {labels.map((label, index) => {
          const position = getLabelPosition(index);
          const xOffset = index === 0 ? 0 : index === 1 ? -25 : 25;
          const yOffset = index === 0 ? 0 : 10;

          return (
            <SvgText
              key={label}
              x={position.x + xOffset}
              y={position.y + yOffset}
              textAnchor="middle"
              fontSize="12"
              fill="#6B7280"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <MyRectangle width={16} height={16} />
          <Text style={styles.legendText}>{myMeasurementLabel}</Text>
        </View>
        <View style={styles.legendItem}>
          <KoreanRectangle width={16} height={16} />
          <Text style={styles.legendText}>{avgLabel}</Text>
        </View>
      </View>

      <Text style={styles.chartCaption}>{chartDescriptionText}</Text>
    </View>
  );
}

function ReportItem({
  item,
  onPress,
}: {
  item: ReportListItem;
  onPress: (item: ReportListItem) => void;
}) {
  const isDisabled = !item.navigationId;

  return (
    <Pressable
      style={styles.itemCard}
      disabled={isDisabled}
      onPress={() => onPress(item)}
    >
      <View style={styles.itemLeft}>
        <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
        <View style={item.source === 'rotation' ? styles.ThreeitemBadge : styles.itemBadge}>
          <Text style={item.source === 'rotation' ? styles.ThreeitemBadgeText : styles.itemBadgeText}>
            {item.badgeLabel}
          </Text>
        </View>
      </View>

      <View style={styles.itemRight}>
        {item.metrics.map((metric) => (
          <Text key={metric.label} style={styles.metricLine}>
            <Text style={styles.metricLabel}>{metric.label} </Text>
            <Text style={styles.metricValue}>{formatDegree(metric.value)}</Text>
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

function SummaryCard({
  label,
  value,
  selected,
  onPress,
}: {
  label: string;
  value: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.summaryCard,
        selected ? styles.summaryCardActive : null,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.summaryLabel, selected ? styles.summaryLabelActive : null]}>{label}</Text>
      <Text style={[styles.summaryValue, selected ? styles.summaryValueActive : null]}>{value}</Text>
    </Pressable>
  );
}

function TrendValueChart({
  records,
  selectedAngle,
  selectedPeriod,
}: {
  records: CurvatureResponse[];
  selectedAngle: TrendAngleKey;
  selectedPeriod: TrendPeriodKey;
}) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(1, width - 72);

  const sortedRecords = useMemo(
    () =>
      [...records].sort(
        (left, right) =>
          new Date(getMeasurementDate(left)).getTime() - new Date(getMeasurementDate(right)).getTime(),
      ),
    [records],
  );

  const periodRecords = useMemo(() => {
    if (!sortedRecords.length) return [];

    const periodOption = getPeriodOption(selectedPeriod);
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (periodOption.days - 1));
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return sortedRecords.filter((record) => {
      const measurementDate = new Date(getMeasurementDate(record));
      return measurementDate >= startDate && measurementDate <= endDate;
    });
  }, [selectedPeriod, sortedRecords]);

  const values = useMemo(
    () => periodRecords.map((record) => formatAngleValue(getTrendValue(record, selectedAngle))),
    [periodRecords, selectedAngle],
  );

  const averageChange = useMemo(() => {
    if (values.length < 2) return 0;

    let total = 0;
    for (let index = 1; index < values.length; index += 1) {
      total += Math.abs(values[index] - values[index - 1]);
    }

    return Number((total / (values.length - 1)).toFixed(1));
  }, [values]);

  const recentChange = useMemo(() => {
    if (values.length < 2) return 0;

    const last = values[values.length - 1];
    const previous = values[values.length - 2];

    return Number((last - previous).toFixed(1));
  }, [values]);

  const hasData = values.length > 0;
  const trendPath = useMemo(
    () => buildTrendPath(values, chartWidth),
    [chartWidth, values],
  );
  const xAxisLabels = getTrendAxisLabels(selectedPeriod);

  return (
    <View style={styles.trendCard}>
      <View style={styles.trendHeader}>
        <View style={styles.trendSummary}>
          <Text style={styles.trendTitle}>평균 변화량</Text>
          <View style={styles.trendValueRow}>
            <Text style={styles.trendValue}>{formatChangeAngle(averageChange)}</Text>
            <View style={styles.trendBadge}>
              <Text style={styles.trendBadgeText}>최근 변화 {formatChangeAngle(recentChange, true)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.trendLegend}>
          <View style={styles.trendLegendRow}>
            <View style={[styles.trendLegendLine, styles.trendLegendDanger]} />
            <Text style={[styles.trendLegendText, styles.trendLegendDangerText]}>위험</Text>
          </View>
          <View style={styles.trendLegendRow}>
            <View style={[styles.trendLegendLine, styles.trendLegendWarning]} />
            <Text style={[styles.trendLegendText, styles.trendLegendWarningText]}>보통</Text>
          </View>
          <View style={styles.trendLegendRow}>
            <View style={[styles.trendLegendLine, styles.trendLegendNormal]} />
            <Text style={[styles.trendLegendText, styles.trendLegendNormalText]}>정상</Text>
          </View>
        </View>
      </View>

      {hasData ? (
        <View style={styles.trendChartWrap}>
          <Svg width={chartWidth} height={TREND_CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="reportTrendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#2E96FF" stopOpacity={0.16} />
                <Stop offset="100%" stopColor="#2E96FF" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Line x1="0" y1={getThresholdY(40)} x2={chartWidth} y2={getThresholdY(40)} stroke="#FF4B3C" strokeWidth={1} strokeDasharray="6 6" />
            <Line x1="0" y1={getThresholdY(25)} x2={chartWidth} y2={getThresholdY(25)} stroke="#FABE00" strokeWidth={1} strokeDasharray="6 6" />
            <Line x1="0" y1={getThresholdY(10)} x2={chartWidth} y2={getThresholdY(10)} stroke="#2C9696" strokeWidth={1} strokeDasharray="6 6" />
            {trendPath ? (
              <>
                <Path
                  d={`${trendPath} L ${chartWidth} ${TREND_CHART_HEIGHT} L 0 ${TREND_CHART_HEIGHT} Z`}
                  fill="url(#reportTrendAreaGradient)"
                />
                <Path
                  d={trendPath}
                  fill="none"
                  stroke="#2E96FF"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : null}
          </Svg>
        </View>
      ) : (
        <View style={styles.trendEmptyState}>
          <Text style={styles.trendEmptyText}>선택한 기간의 측정 데이터가 없습니다.</Text>
        </View>
      )}

      <View style={styles.trendXAxis}>
        {xAxisLabels.map((label) => (
          <Text key={label} style={styles.trendXAxisText}>{label}</Text>
        ))}
      </View>
    </View>
  );
}

export default function ReportScreen() {
  const router = useRouter();
  const [curvatures, setCurvatures] = useState<CurvatureResponse[]>([]);
  const [rotations, setRotations] = useState<RotationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [selectedReportAngle, setSelectedReportAngle] = useState<TrendAngleKey>('proximal');
  const [selectedTrendPeriod, setSelectedTrendPeriod] = useState<TrendPeriodKey>('month1');
  const [periodDropdownVisible, setPeriodDropdownVisible] = useState(false);
  const [tabsWidth, setTabsWidth] = useState(0);
  const animatedTab = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [curvatureResult, rotationResult] = await Promise.allSettled([
          curvatureAPI.getAnalyses({ limit: 100 }),
          rotationAPI.getAnalyses({ limit: 100 }),
        ]);

        if (!active) return;

        if (curvatureResult.status === 'fulfilled') {
          console.log('[curvature] request url', curvatureResult.value.config?.baseURL, curvatureResult.value.config?.url);
          const sortedCurvatures = [...curvatureResult.value.data].sort(
            (left, right) =>
              new Date(getMeasurementDate(right)).getTime() - new Date(getMeasurementDate(left)).getTime(),
          );
          setCurvatures(sortedCurvatures);
        } else {
          console.error('Failed to load curvatures:', curvatureResult.reason);
          setCurvatures([]);
        }

        if (rotationResult.status === 'fulfilled') {
          const sortedRotations = [...rotationResult.value.data].sort(
            (left, right) =>
              new Date(getMeasurementDate(right)).getTime() - new Date(getMeasurementDate(left)).getTime(),
          );
          setRotations(sortedRotations);
        } else {
          console.error('Failed to load rotations:', rotationResult.reason);
          setRotations([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const targetIndex = FILTERS.findIndex((item) => item.key === selectedFilter);

    Animated.timing(animatedTab, {
      toValue: targetIndex < 0 ? 0 : targetIndex,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedTab, selectedFilter]);

  const listItems = useMemo(() => {
    const merged = [
      ...curvatures.map(toCurvatureListItem),
      ...rotations.map(toRotationListItem),
    ];

    return merged.sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }, [curvatures, rotations]);

  const filteredItems = useMemo(() => {
    if (selectedFilter === 'all') return listItems;
    return listItems.filter((item) => item.category === selectedFilter);
  }, [listItems, selectedFilter]);

  const latestCurvature = useMemo(() => curvatures[0] ?? null, [curvatures]);

  const myValues: [number, number, number] = [
    Math.abs(latestCurvature?.secondary_thoracic_cobb ?? 0),
    Math.abs(latestCurvature?.main_thoracic_cobb ?? 0),
    Math.abs(latestCurvature?.lumbar_cobb ?? 0),
  ];

  const avgValues: [number, number, number] = [18, 18, 18];
  const summaryCards = [
    { key: 'proximal' as const, label: CURVATURE_METRIC_LABELS[0], value: formatRoundedDegree(latestCurvature?.secondary_thoracic_cobb) },
    { key: 'main' as const, label: CURVATURE_METRIC_LABELS[1], value: formatRoundedDegree(latestCurvature?.main_thoracic_cobb) },
    { key: 'lumbar' as const, label: CURVATURE_METRIC_LABELS[2], value: formatRoundedDegree(latestCurvature?.lumbar_cobb) },
  ];
  const selectedPeriodLabel = getPeriodOption(selectedTrendPeriod).label;

  const tabWidth = tabsWidth > 0 ? tabsWidth / FILTERS.length : 0;
  const translateX = tabWidth
    ? animatedTab.interpolate({
        inputRange: FILTERS.map((_, index) => index),
        outputRange: FILTERS.map((_, index) => tabWidth * index),
      })
    : 0;

  const handleTabsLayout = (event: LayoutChangeEvent) => {
    setTabsWidth(event.nativeEvent.layout.width);
  };

  const handleAnalysisPress = (item: ReportListItem) => {
    if (!item.navigationId) return;
    router.push({
      pathname: '/analysis/[id]',
      params: {
        id: item.navigationId,
        source: item.source,
      },
    });
  };

  const handleGoHome = () => {
    router.replace('/home');
  };

  const handlePeriodSelect = (period: TrendPeriodKey) => {
    setSelectedTrendPeriod(period);
    setPeriodDropdownVisible(false);
  };

  const hasCurvatureData = curvatures.length > 0;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right' , ]} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: 8,
              paddingBottom: 20,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>척추 균형 분석</Text>

          <View style={styles.chartCard}>
             <TriangleChart
              myValues={myValues}
              avgValues={avgValues}
              labels={['상부 흉추 각도', '주 흉추 각도', '요추 각도']}
              myMeasurementLabel="내 측정값"
              avgLabel="한국인 평균 측정값"
              chartDescriptionText="중심에 가까울수록 정상 범위에 가깝습니다."
            />

            {!hasCurvatureData ? (
              <View style={styles.emptyOverlay}>
                <BlurView intensity={110} tint="light" style={styles.blurView} pointerEvents="none" />
                <View style={styles.grayOverlay} pointerEvents="none" />
                <View style={styles.emptyContent}>
                  <View style={styles.emptyStateCard}>
                    <View style={styles.emptyStateHeader}>
                      <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
                        <Defs>
                          <LinearGradient id="emptyHeaderGradient" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="18%" stopColor="#D6FFFE" />
                            <Stop offset="100%" stopColor="#FFFFFF" />
                          </LinearGradient>
                        </Defs>
                        <Rect width="100%" height="100%" fill="url(#emptyHeaderGradient)" />
                      </Svg>
                      <TwoDCamera width={110} height={110} />
                    </View>

                    <View style={styles.emptyStateBody}>
                      <Text style={styles.emptyStateTitle}>먼저 측정을 해야해요</Text>
                      <Text style={styles.emptyStateMessage}>
                        분석을 위해선 먼저 측정을 해야해요
                        {'\n'}
                        아래 버튼을 눌러서 진행해주세요
                      </Text>
                      <Pressable style={styles.emptyStateButton} onPress={handleGoHome}>
                        <Text style={styles.emptyStateButtonText}>홈으로 돌아가기</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>최근 측정 결과</Text>
            <View style={styles.periodSelectorWrap}>
              <Pressable
                style={({ pressed }) => [styles.periodSelectButton, pressed && styles.pressed]}
                onPress={() => setPeriodDropdownVisible((visible) => !visible)}
              >
                <Text style={styles.periodSelectText}>{selectedPeriodLabel}</Text>
                <Ionicons name="chevron-down" size={16} color="#B6BECE" />
              </Pressable>

              {periodDropdownVisible ? (
                <View style={styles.periodDropdownCard}>
                  {TREND_PERIOD_OPTIONS.map((option) => {
                    const selected = selectedTrendPeriod === option.key;

                    return (
                      <Pressable
                        key={option.key}
                        style={[styles.periodDropdownOption, selected ? styles.periodDropdownOptionActive : null]}
                        onPress={() => handlePeriodSelect(option.key)}
                      >
                        <Text style={[styles.periodDropdownOptionText, selected ? styles.periodDropdownOptionTextActive : null]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.summaryRow}>
            {summaryCards.map((card) => (
              <SummaryCard
                key={card.key}
                label={card.label}
                value={card.value}
                selected={selectedReportAngle === card.key}
                onPress={() => setSelectedReportAngle(card.key)}
              />
            ))}
          </View>

          <TrendValueChart
            records={curvatures}
            selectedAngle={selectedReportAngle}
            selectedPeriod={selectedTrendPeriod}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>측정 목록</Text>

            <View style={styles.tabsWrap} onLayout={handleTabsLayout}>
              <View style={styles.tabs}>
                {FILTERS.map((filter) => {
                  const tabIndex = FILTERS.findIndex((item) => item.key === filter.key);
                  const color = animatedTab.interpolate({
                    inputRange: [tabIndex - 1, tabIndex, tabIndex + 1],
                    outputRange: ['#111827', '#5E9F9E', '#111827'],
                    extrapolate: 'clamp',
                  });

                  return (
                    <Pressable
                      key={filter.key}
                      onPress={() => setSelectedFilter(filter.key)}
                      style={styles.tabButton}
                    >
                      <Animated.Text style={[styles.tabText, { color }]}>{filter.label}</Animated.Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.tabDivider} />

              {tabWidth > 0 ? (
                <Animated.View
                  style={[
                    styles.tabIndicator,
                    {
                      width: tabWidth,
                      transform: [{ translateX: translateX as never }],
                    },
                  ]}
                />
              ) : null}
            </View>

            <View
              style={[
                styles.listArea,
                !loading && filteredItems.length === 0 ? styles.listAreaEmpty : null,
              ]}
            >
              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color="#69B7BC" />
                </View>
              ) : filteredItems.length > 0 ? (
                <ScrollView
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listScrollContent}
                >
                  <View style={styles.list}>
                    {filteredItems.map((item) => (
                      <ReportItem key={item.id} item={item} onPress={handleAnalysisPress} />
                    ))}
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>
                    아직 측정 기록이 없어요
                  </Text>
                  <Text style={styles.emptyText}>측정을 진행한 뒤 이곳에서 기록을 확인할 수 있어요</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

    </View>
  );
}
