import { Ionicons } from '@expo/vector-icons';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  LayoutChangeEvent,
  Modal,
    NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useScrollToTop } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { measurementSetAPI } from '@/src/api/measurementSet';
import MeasurementRequiredCard from '@/src/components/MeasurementRequiredCard';
import TopScrollGradient, { useTopScrollGradient } from '@/src/components/TopScrollGradient';
import { Colors } from '@/src/constants/theme';
import { useMeasurementRefreshStore } from '@/src/store/measurementRefreshStore';
import { useReportMeasurementListFilterStore } from '@/src/store/reportMeasurementListFilterStore';
import type { CurvatureResponse } from '@/src/types/curvature';
import type { MeasurementSetResponse } from '@/src/types/measurementSet';
import ReportAiDoctorCard from '@/src/features/report/components/ReportAiDoctorCard';
import ReportTrendChart from '@/src/features/report/components/ReportTrendChart';
import styles, { getReportMeasurementListLayout, getReportMonthSheetLayout } from '@/src/features/report/report.styles';
import {
  getMeasurementDate,
  getPeriodOption,
  getRecentDateRange,
  formatDateParam,
  REPORT_CURVATURE_DAYS,
  TREND_PERIOD_OPTIONS,
  type TrendAngleKey,
  type TrendPeriodKey,
} from '@/src/features/report/reportTrend';
import MyRectangle from '../../../assets/icons/my_rectangle.svg';
import KoreanRectangle from '../../../assets/icons/korean_rectangle.svg';
import TwoDCamera from '../../../assets/icons/2D_camera.svg';

type FilterKey = 'all' | '2d' | '3d';
type MeasurementListItem = {
  id: string;
  createdAt: string;
  category: '2d' | '3d';
  measurementSet: MeasurementSetResponse;
  navigationId?: string;
};

const MEASUREMENT_FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: '2d', label: '2D 측정' },
  { key: '3d', label: '3D 스캔' },
];

const WIDE_LAYOUT_MIN_WIDTH = 600;
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

const CURVATURE_METRIC_LABELS = [
  '상부 흉추만곡',
  '주 흉추만곡',
  '요추만곡',
] as const;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function getMonthSelectionYears(date: Date) {
  const currentYear = date.getFullYear();
  return Array.from({ length: 4 }, (_, index) => currentYear - 3 + index);
}

function isFutureMonth(year: number, month: number, currentDate: Date) {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  return year > currentYear || (year === currentYear && month > currentMonth);
}

function getMonthDateRange(year: number, month: number) {
  const fromDate = new Date(year, month - 1, 1);
  const toDate = new Date(year, month, 0);

  return {
    from_date: formatDateParam(fromDate),
    to_date: formatDateParam(toDate),
  };
}

function formatRoundedDegree(value?: number | null) {
  if (value === null || value === undefined) return '-';
  return `${Math.round(Math.abs(value))}°`;
}

function formatRotationDegree(value?: number | null) {
  if (value === null || value === undefined) return '-';
  const rounded = Math.round(Math.abs(value) * 10) / 10;

  if (Number.isInteger(rounded)) {
    return `${rounded.toFixed(0)}°`;
  }

  return `${rounded.toFixed(1)}°`;
}

function formatCurvatureDegree(value?: number | null) {
  if (value === null || value === undefined) return '-';
  return `${Math.round(Math.abs(value))}°`;
}

function getCurvatureDotColor(value?: number | null) {
  // 만곡 각도 구간에 따라 목록의 상태 점 색상을 나눈다.
  const angle = Math.abs(value ?? 0);

  if (angle < 15) {
    return Colors.mint[300];
  }

  if (angle < 25) {
    return Colors.yellow[300];
  }

  return Colors.red[300];
}

function toMeasurementListItem(measurementSet: MeasurementSetResponse): MeasurementListItem | null {
  // 리포트 목록은 만곡 결과가 있는 측정 세트만 상세 화면으로 연결한다.
  if (!measurementSet.curvature) {
    return null;
  }

  const createdAt = getMeasurementDate(measurementSet.curvature);

  return {
    id: `measurement-set-${measurementSet.curvature.id}`,
    createdAt,
    category: '2d',
    measurementSet,
    navigationId: String(measurementSet.curvature.id),
  };
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
    // 세 부위 값을 120도 간격의 삼각형 좌표로 변환한다.
    const angle = (index * 120 - 90) * (Math.PI / 180);
    const radius = (Math.min(value, maxAngle) / maxAngle) * maxRadius;

    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const createPath = (values: [number, number, number]) => {
    // 세 좌표를 닫힌 면으로 이어 내 측정값과 평균값 영역을 그린다.
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
  item: MeasurementListItem;
  onPress: (item: MeasurementListItem) => void;
}) {
  const isDisabled = !item.navigationId;
  const { width } = useWindowDimensions();
  const isWideLayout = width >= WIDE_LAYOUT_MIN_WIDTH;
  const { curvature, rotation } = item.measurementSet;
  const measurementListLayout = getReportMeasurementListLayout(width);

  if (!curvature) {
    return null;
  }

  const regions = [
    {
      key: 'upper',
      label: '상부 흉추',
      curvatureValue: curvature.secondary_thoracic_cobb,
      rotationValue: rotation?.upper_thoracic_atr,
    },
    {
      key: 'main',
      label: '주 흉추',
      curvatureValue: curvature.main_thoracic_cobb,
      rotationValue: rotation?.thoracic_atr,
    },
    {
      key: 'lumbar',
      label: '요추',
      curvatureValue: curvature.lumbar_cobb,
      rotationValue: rotation?.lumbar_atr,
    },
  ];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.measurementCard,
        {
          minHeight: measurementListLayout.cardMinHeight,
          paddingHorizontal: measurementListLayout.cardPaddingHorizontal,
          paddingVertical: measurementListLayout.cardPaddingVertical,
          borderRadius: measurementListLayout.cardRadius,
        },
        pressed && styles.pressed,
      ]}
      disabled={isDisabled}
      onPress={() => onPress(item)}
    >
      <View
        style={[
          styles.measurementCardHeader,
          {
            minHeight: measurementListLayout.headerMinHeight,
            gap: measurementListLayout.headerGap,
            marginBottom: measurementListLayout.headerMarginBottom,
          },
        ]}
      >
        <Text
          style={[
            styles.measurementDate,
            {
              fontSize: measurementListLayout.dateFontSize,
              lineHeight: measurementListLayout.dateLineHeight,
            },
          ]}
        >
          {formatDate(item.createdAt)}
        </Text>
        <View
          style={[
            styles.measurementBadge,
            {
              minWidth: measurementListLayout.measureBadgeMinWidth,
              minHeight: measurementListLayout.measureBadgeMinHeight,
              paddingHorizontal: measurementListLayout.measureBadgePaddingHorizontal,
              paddingVertical: measurementListLayout.measureBadgePaddingVertical,
              borderRadius: measurementListLayout.measureBadgeRadius,
            },
          ]}
        >
          <Text
            style={[
              styles.measurementBadgeText,
              {
                fontSize: measurementListLayout.measureBadgeTextFontSize,
                lineHeight: measurementListLayout.measureBadgeTextLineHeight,
              },
            ]}
          >
            2D 측정
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.measurementRegionRow,
          {
            gap: measurementListLayout.regionGap,
            minHeight: measurementListLayout.regionRowMinHeight,
          },
        ]}
      >
        {regions.map((region, index) => (
          <Fragment key={region.key}>
            <View style={styles.measurementRegion}>
            <View
              style={[
                styles.measurementRegionPill,
                {
                  minHeight: measurementListLayout.regionPillMinHeight,
                  gap: measurementListLayout.regionPillGap,
                  paddingHorizontal: measurementListLayout.regionPillPaddingHorizontal,
                  paddingVertical: measurementListLayout.regionPillPaddingVertical,
                },
              ]}
            >
              <Text
                style={[
                  styles.measurementRegionLabel,
                  {
                    fontSize: measurementListLayout.regionLabelFontSize,
                    lineHeight: measurementListLayout.regionLabelLineHeight,
                  },
                ]}
                numberOfLines={1}
              >
                {region.label}
              </Text>
              <View
                style={[
                  styles.measurementRegionDot,
                  {
                    width: measurementListLayout.regionDotSize,
                    height: measurementListLayout.regionDotSize,
                    borderRadius: measurementListLayout.regionDotRadius,
                    backgroundColor: getCurvatureDotColor(region.curvatureValue),
                  },
                ]}
              />
            </View>

              <View
                style={[
                  styles.measurementValueRow,
                  isWideLayout ? styles.measurementValueRowWide : null,
                  {
                    gap: measurementListLayout.valueGap,
                    marginTop: measurementListLayout.valueRowMarginTop,
                    minHeight: measurementListLayout.valueRowMinHeight,
                  },
                ]}
              >
                <View style={[styles.measurementValueBlock, { width: measurementListLayout.valueBlockWidth }]}>
                  <Text
                    style={[
                      styles.measurementValueLabel,
                      {
                        fontSize: measurementListLayout.valueLabelFontSize,
                        lineHeight: measurementListLayout.valueLabelLineHeight,
                      },
                    ]}
                  >
                    만곡도
                  </Text>
                  <Text
                    style={[
                      styles.measurementCurvatureValue,
                      {
                        fontSize: measurementListLayout.valueFontSize,
                        lineHeight: measurementListLayout.valueLineHeight,
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                  >
                    {formatCurvatureDegree(region.curvatureValue)}
                  </Text>
                </View>

                <View style={[styles.measurementValueBlock, { width: measurementListLayout.valueBlockWidth }]}>
                  <Text
                    style={[
                      styles.measurementValueLabel,
                      {
                        fontSize: measurementListLayout.valueLabelFontSize,
                        lineHeight: measurementListLayout.valueLabelLineHeight,
                      },
                    ]}
                  >
                    비틀림
                  </Text>
                  <Text
                    style={[
                      styles.measurementRotationValue,
                      {
                        fontSize: measurementListLayout.valueFontSize,
                        lineHeight: measurementListLayout.valueLineHeight,
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                  >
                    {formatRotationDegree(region.rotationValue)}
                  </Text>
                </View>
              </View>
            </View>
            {index < regions.length - 1 ? (
              <View
                style={[
                  styles.measurementRegionSeparator,
                  { height: measurementListLayout.regionSeparatorHeight },
                ]}
              />
            ) : null}
          </Fragment>
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

export default function ReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const currentMonthDate = useMemo(() => new Date(), []);
  const [curvatures, setCurvatures] = useState<CurvatureResponse[]>([]);
  const [measurementSets, setMeasurementSets] = useState<MeasurementSetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [selectedReportAngle, setSelectedReportAngle] = useState<TrendAngleKey>('proximal');
  const [selectedTrendPeriod, setSelectedTrendPeriod] = useState<TrendPeriodKey>('month1');
  const [periodDropdownVisible, setPeriodDropdownVisible] = useState(false);
  const [monthSheetVisible, setMonthSheetVisible] = useState(false);
  const [measurementListLoading, setMeasurementListLoading] = useState(true);
  const [tabsWidth, setTabsWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const measurementVersion = useMeasurementRefreshStore((state) => state.version);
  const measurementListMonthMode = useReportMeasurementListFilterStore((state) => state.monthMode);
  const selectedMeasurementListYear = useReportMeasurementListFilterStore((state) => state.selectedYear);
  const selectedMeasurementListMonth = useReportMeasurementListFilterStore((state) => state.selectedMonth);
  const setMeasurementListMonthMode = useReportMeasurementListFilterStore((state) => state.setMonthMode);
  const setSelectedMeasurementListYear = useReportMeasurementListFilterStore((state) => state.setSelectedYear);
  const setSelectedMeasurementListMonth = useReportMeasurementListFilterStore((state) => state.setSelectedMonth);
  const topScrollGradient = useTopScrollGradient();
   const animatedTab = useMemo(() => new Animated.Value(0), []);
  // 외부 스크롤 위치 감지하여, 끝에 도달하기 전까지 측정 목록 스크롤 비활성화
  const [canScrollList, setCanScrollList] = useState(false);
  const canScrollListRef = useRef(false);


  // 탭 색깔
  const activeTabColor =
  selectedFilter === '3d'
    ? '#456EFF'
    : selectedFilter === '2d'
      ? '#2C9696'
      : '#2C9696';


  const activeIndicatorColor =
    selectedFilter === '3d'
      ? '#456EFF'
      : selectedFilter === '2d'
        ? '#2C9696'
        : '#2C9696';


  // 현재 선택된 리포트 탭을 다시 누르면 메인 스크롤만 맨 위로 올린다.
  useScrollToTop(scrollRef);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        // 리포트 상단 데이터는 측정 목록의 월 선택과 별개로 기존 기간 기준을 유지한다.
        const response = await curvatureAPI.getAnalyses({
          limit: 1000,
          ...getRecentDateRange(REPORT_CURVATURE_DAYS),
        });

        if (!active) return;

        const sortedCurvatures = [...response.data].sort(
          (left, right) =>
            new Date(getMeasurementDate(right)).getTime() - new Date(getMeasurementDate(left)).getTime(),
        );
        setCurvatures(sortedCurvatures);
      } catch (error) {
        console.error('Failed to load curvatures:', error);
        setCurvatures([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [measurementVersion]);

  useEffect(() => {
    let active = true;

    const loadMeasurementSets = async () => {
      try {
        setMeasurementListLoading(true);
        // 전체는 날짜 파라미터를 보내지 않고, 지정 월은 해당 월의 시작일과 마지막일만 조회한다.
        const response = await measurementSetAPI.getAnalyses({
          limit: 1000,
          ...(measurementListMonthMode === 'specific'
            ? getMonthDateRange(selectedMeasurementListYear, selectedMeasurementListMonth)
            : {}),
        });

        if (!active) return;

        setMeasurementSets(response.data);
      } catch (error) {
        console.error('Failed to load measurement sets:', error);
        setMeasurementSets([]);
      } finally {
        if (active) setMeasurementListLoading(false);
      }
    };

    void loadMeasurementSets();

    return () => {
      active = false;
    };
  }, [
    measurementListMonthMode,
    measurementVersion,
    selectedMeasurementListMonth,
    selectedMeasurementListYear,
  ]);

  useEffect(() => {
    const targetIndex = MEASUREMENT_FILTERS.findIndex((item) => item.key === selectedFilter);

    // 선택된 탭 위치로 밑줄과 글자색을 부드럽게 이동시킨다.
    Animated.timing(animatedTab, {
      toValue: targetIndex < 0 ? 0 : targetIndex,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedTab, selectedFilter]);

  const listItems = useMemo(() => {
    // 서버 응답을 화면 목록 전용 형태로 바꾸고 최신 측정순으로 정렬한다.
    const items = measurementSets
      .map(toMeasurementListItem)
      .filter((item): item is MeasurementListItem => item !== null);

    return items.sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }, [measurementSets]);

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
  const monthSheetLayout = useMemo(() => getReportMonthSheetLayout(screenWidth), [screenWidth]);
  const monthSelectionYears = useMemo(() => getMonthSelectionYears(currentMonthDate), [currentMonthDate]);
  const measurementListMonthLabel =
    measurementListMonthMode === 'all'
      ? '전체'
      : `${selectedMeasurementListYear}년 ${selectedMeasurementListMonth}월`;

  const tabWidth = tabsWidth > 0 ? tabsWidth / MEASUREMENT_FILTERS.length : 0;
  const translateX = tabWidth
    ? animatedTab.interpolate({
        inputRange: MEASUREMENT_FILTERS.map((_, index) => index),
        outputRange: MEASUREMENT_FILTERS.map((_, index) => tabWidth * index),
      })
    : 0;

  const handleTabsLayout = (event: LayoutChangeEvent) => {
    setTabsWidth(event.nativeEvent.layout.width);
  };

  const handleOuterScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    topScrollGradient.onScroll(event);

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 8;

    if (canScrollListRef.current !== isNearBottom) {
      canScrollListRef.current = isNearBottom;
      setCanScrollList(isNearBottom);
    }
    };

  const handleAnalysisPress = (item: MeasurementListItem) => {
    // 상세 화면은 현재 만곡 결과 아이디를 경로 파라미터로 받아 다시 조회한다.
    if (!item.navigationId) return;
    router.push({
      pathname: '/analysis-detail/[id]',
      params: {
        id: item.navigationId,
        source: 'curvature',
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

  const handleSelectAllMonths = () => {
    setMeasurementListMonthMode('all');
    setMonthSheetVisible(false);
  };

  const handleSelectSpecificMonthMode = () => {
    setMeasurementListMonthMode('specific');
  };

  const handleSelectMeasurementListYear = (year: number) => {
    setMeasurementListMonthMode('specific');
    setSelectedMeasurementListYear(year);

    if (isFutureMonth(year, selectedMeasurementListMonth, currentMonthDate)) {
      setSelectedMeasurementListMonth(currentMonthDate.getMonth() + 1);
    }
  };

  const handleSelectMeasurementListMonth = (month: number) => {
    if (isFutureMonth(selectedMeasurementListYear, month, currentMonthDate)) {
      return;
    }

    setMeasurementListMonthMode('specific');
    setSelectedMeasurementListMonth(month);
    setMonthSheetVisible(false);
  };

  const hasCurvatureData = curvatures.length > 0;
  const shouldShowMeasurementRequired = !loading && !hasCurvatureData;
  if (loading) {
  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <View style={styles.screenLoadingBox}>
          <ActivityIndicator color="#69B7BC" />
          <Text style={styles.screenLoadingText}>리포트를 불러오는 중입니다...</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right' , ]} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          onScroll={handleOuterScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.content,
            shouldShowMeasurementRequired ? styles.measurementRequiredContent : null,
            {
              paddingTop: 8,
              paddingBottom: 16,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {shouldShowMeasurementRequired ? (
            <MeasurementRequiredCard onPress={handleGoHome} />
          ) : (
            <>
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

            {!loading && !hasCurvatureData ? (
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

          <ReportTrendChart
            records={curvatures}
            selectedAngle={selectedReportAngle}
            selectedPeriod={selectedTrendPeriod}
          />

          <ReportAiDoctorCard latestCurvature={latestCurvature} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>측정 목록</Text>
              <Pressable
                style={({ pressed }) => [styles.monthSelectButton, pressed && styles.pressed]}
                onPress={() => setMonthSheetVisible(true)}
              >
                <Text style={styles.monthSelectText}>{measurementListMonthLabel}</Text>
              </Pressable>
            </View>

            <View style={styles.tabsWrap} onLayout={handleTabsLayout}>
              <View style={styles.tabs}>
                {MEASUREMENT_FILTERS.map((filter) => {
                  const tabIndex = MEASUREMENT_FILTERS.findIndex((item) => item.key === filter.key);
                  const color = animatedTab.interpolate({
                    inputRange: [tabIndex - 1, tabIndex, tabIndex + 1],
                    outputRange: ['#000000', activeTabColor, '#000000'],
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
                      backgroundColor : activeIndicatorColor,
                      transform: [{ translateX: translateX as never }],
                    },
                  ]}
                />
              ) : null}
            </View>

            <View
              style={[
                styles.listArea,
                !measurementListLoading && filteredItems.length === 0 ? styles.listAreaEmpty : null,
              ]}
            >
              {measurementListLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color="#69B7BC" />
                </View>
              ) : filteredItems.length > 0 ? (
                <ScrollView
                  scrollEnabled={canScrollList}
                  nestedScrollEnabled={canScrollList}
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
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      <Modal
        visible={monthSheetVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setMonthSheetVisible(false)}
      >
        <View style={styles.monthSheetOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setMonthSheetVisible(false)} />
          <View
            style={[
              styles.monthSheetCard,
              {
                marginBottom: insets.bottom,
                paddingHorizontal: monthSheetLayout.cardPaddingHorizontal,
                paddingTop: monthSheetLayout.cardPaddingTop,
                paddingBottom: monthSheetLayout.cardPaddingBottom,
              },
            ]}
          >
            <Text
              style={[
                styles.monthSheetTitle,
                {
                  fontSize: monthSheetLayout.titleFontSize,
                  lineHeight: monthSheetLayout.titleLineHeight,
                },
              ]}
            >
              날짜 선택
            </Text>
            <Text
              style={[
                styles.monthSheetDescription,
                {
                  fontSize: monthSheetLayout.descriptionFontSize,
                  lineHeight: monthSheetLayout.descriptionLineHeight,
                },
              ]}
            >
              보고싶은 리포트의 연월을 설정해주세요
            </Text>

            <View
              style={[
                styles.monthPickerRow,
                {
                  marginTop: monthSheetLayout.rowMarginTop,
                  width: monthSheetLayout.rowWidth,
                  minHeight: monthSheetLayout.rowMinHeight,
                  gap: monthSheetLayout.rowGap,
                },
              ]}
            >
              <View
                style={[
                  styles.monthPickerColumn,
                  styles.monthPickerSideColumn,
                  { width: monthSheetLayout.sideColumnWidth },
                ]}
              >
                <Pressable
                  style={[
                    styles.monthPickerOption,
                    {
                      width: monthSheetLayout.sideColumnWidth,
                      minHeight: monthSheetLayout.optionMinHeight,
                    },
                    measurementListMonthMode === 'all' ? styles.monthPickerOptionSelected : null,
                  ]}
                  onPress={handleSelectAllMonths}
                >
                  <Text
                    style={[
                      styles.monthPickerOptionText,
                      {
                        fontSize: monthSheetLayout.optionFontSize,
                        lineHeight: monthSheetLayout.optionLineHeight,
                      },
                      measurementListMonthMode === 'all' ? styles.monthPickerOptionTextSelected : null,
                      measurementListMonthMode === 'specific' ? styles.monthPickerOptionTextMuted : null,
                    ]}
                  >
                    전체
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.monthPickerOption,
                    {
                      width: monthSheetLayout.sideColumnWidth,
                      minHeight: monthSheetLayout.optionMinHeight,
                    },
                    measurementListMonthMode === 'specific' ? styles.monthPickerOptionSelected : null,
                  ]}
                  onPress={handleSelectSpecificMonthMode}
                >
                  <Text
                    style={[
                      styles.monthPickerOptionText,
                      {
                        fontSize: monthSheetLayout.optionFontSize,
                        lineHeight: monthSheetLayout.optionLineHeight,
                      },
                      measurementListMonthMode === 'specific' ? styles.monthPickerOptionTextSelected : null,
                      measurementListMonthMode === 'all' ? styles.monthPickerOptionTextMuted : null,
                    ]}
                  >
                    지정
                  </Text>
                </Pressable>
              </View>

              <View
                style={[
                  styles.monthPickerColumn,
                  styles.monthPickerYearColumn,
                  { width: monthSheetLayout.yearColumnWidth },
                ]}
              >
                {monthSelectionYears.map((year) => {
                  const selected = measurementListMonthMode === 'specific' && selectedMeasurementListYear === year;

                  return (
                    <Pressable
                      key={year}
                      style={[
                        styles.monthPickerOption,
                        {
                          width: monthSheetLayout.yearColumnWidth,
                          minHeight: monthSheetLayout.optionMinHeight,
                        },
                        selected ? styles.monthPickerOptionSelected : null,
                      ]}
                      onPress={() => handleSelectMeasurementListYear(year)}
                    >
                      <Text
                        style={[
                          styles.monthPickerOptionText,
                          {
                            fontSize: monthSheetLayout.optionFontSize,
                            lineHeight: monthSheetLayout.optionLineHeight,
                          },
                          selected ? styles.monthPickerOptionTextSelected : null,
                          measurementListMonthMode === 'all' ? styles.monthPickerOptionTextMuted : null,
                        ]}
                      >
                        {year}년
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <ScrollView
                style={[
                  styles.monthPickerScrollColumn,
                  styles.monthPickerSideColumn,
                  {
                    width: monthSheetLayout.sideColumnWidth,
                    maxHeight: monthSheetLayout.scrollMaxHeight,
                  },
                ]}
                contentContainerStyle={[
                  styles.monthPickerScrollContent,
                  { paddingVertical: monthSheetLayout.scrollPaddingVertical },
                ]}
                showsVerticalScrollIndicator={false}
              >
                {MONTH_OPTIONS.map((month) => {
                  const disabled = isFutureMonth(selectedMeasurementListYear, month, currentMonthDate);
                  const selected =
                    measurementListMonthMode === 'specific' &&
                    selectedMeasurementListMonth === month &&
                    !disabled;

                  return (
                    <Pressable
                      key={month}
                      disabled={disabled}
                      style={[
                        styles.monthPickerOption,
                        {
                          width: monthSheetLayout.sideColumnWidth,
                          minHeight: monthSheetLayout.optionMinHeight,
                        },
                        selected ? styles.monthPickerOptionSelected : null,
                      ]}
                      onPress={() => handleSelectMeasurementListMonth(month)}
                    >
                      <Text
                        style={[
                          styles.monthPickerOptionText,
                          {
                            fontSize: monthSheetLayout.optionFontSize,
                            lineHeight: monthSheetLayout.optionLineHeight,
                          },
                          selected ? styles.monthPickerOptionTextSelected : null,
                          measurementListMonthMode === 'all' || disabled ? styles.monthPickerOptionTextMuted : null,
                        ]}
                      >
                        {month}월
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
      <TopScrollGradient visible={topScrollGradient.visible} />

    </View>
  );
}
