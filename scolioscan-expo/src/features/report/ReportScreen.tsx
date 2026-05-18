import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
import { useMeasurementRefreshStore } from '@/src/store/measurementRefreshStore';
import { useReportMeasurementListFilterStore } from '@/src/store/reportMeasurementListFilterStore';
import type { CurvatureResponse } from '@/src/types/curvature';
import type { MeasurementSetResponse } from '@/src/types/measurementSet';
import ReportAiDoctorCard from '@/src/features/report/components/ReportAiDoctorCard';
import ReportMeasurementListSection from '@/src/features/report/components/ReportMeasurementListSection';
import ReportMonthSheet from '@/src/features/report/components/ReportMonthSheet';
import ReportTrendChart from '@/src/features/report/components/ReportTrendChart';
import styles from '@/src/features/report/report.styles';
import { getMonthDateRange, isFutureMonth } from '@/src/features/report/reportMonthFilter';
import type {
  ReportMeasurementFilterKey,
  ReportMeasurementListItem,
} from '@/src/features/report/reportMeasurementListTypes';
import {
  getMeasurementDate,
  getPeriodOption,
  getRecentDateRange,
  REPORT_CURVATURE_DAYS,
  TREND_PERIOD_OPTIONS,
  type TrendAngleKey,
  type TrendPeriodKey,
} from '@/src/features/report/reportTrend';
import MyRectangle from '../../../assets/icons/my_rectangle.svg';
import KoreanRectangle from '../../../assets/icons/korean_rectangle.svg';
import TwoDCamera from '../../../assets/icons/2D_camera.svg';

const CURVATURE_METRIC_LABELS = [
  '상부 흉추만곡',
  '주 흉추만곡',
  '요추만곡',
] as const;

function formatRoundedDegree(value?: number | null) {
  if (value === null || value === undefined) return '-';
  return `${Math.round(Math.abs(value))}°`;
}

function toMeasurementListItem(measurementSet: MeasurementSetResponse): ReportMeasurementListItem | null {
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
  const currentMonthDate = useMemo(() => new Date(), []);
  const [curvatures, setCurvatures] = useState<CurvatureResponse[]>([]);
  const [measurementSets, setMeasurementSets] = useState<MeasurementSetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<ReportMeasurementFilterKey>('all');
  const [selectedReportAngle, setSelectedReportAngle] = useState<TrendAngleKey>('proximal');
  const [selectedTrendPeriod, setSelectedTrendPeriod] = useState<TrendPeriodKey>('month1');
  const [periodDropdownVisible, setPeriodDropdownVisible] = useState(false);
  const [monthSheetVisible, setMonthSheetVisible] = useState(false);
  const [measurementListLoading, setMeasurementListLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const measurementVersion = useMeasurementRefreshStore((state) => state.version);
  const measurementListMonthMode = useReportMeasurementListFilterStore((state) => state.monthMode);
  const selectedMeasurementListYear = useReportMeasurementListFilterStore((state) => state.selectedYear);
  const selectedMeasurementListMonth = useReportMeasurementListFilterStore((state) => state.selectedMonth);
  const setMeasurementListMonthMode = useReportMeasurementListFilterStore((state) => state.setMonthMode);
  const setSelectedMeasurementListYear = useReportMeasurementListFilterStore((state) => state.setSelectedYear);
  const setSelectedMeasurementListMonth = useReportMeasurementListFilterStore((state) => state.setSelectedMonth);
  const topScrollGradient = useTopScrollGradient();
  // 외부 스크롤 위치 감지하여, 끝에 도달하기 전까지 측정 목록 스크롤 비활성화
  const [canScrollList, setCanScrollList] = useState(false);
  const canScrollListRef = useRef(false);

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

  const listItems = useMemo(() => {
    // 서버 응답을 화면 목록 전용 형태로 바꾸고 최신 측정순으로 정렬한다.
    const items = measurementSets
      .map(toMeasurementListItem)
      .filter((item): item is ReportMeasurementListItem => item !== null);

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
  const measurementListMonthLabel =
    measurementListMonthMode === 'all'
      ? '전체'
      : `${selectedMeasurementListYear}년 ${selectedMeasurementListMonth}월`;

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

  const handleAnalysisPress = (item: ReportMeasurementListItem) => {
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

          <ReportMeasurementListSection
            items={filteredItems}
            selectedFilter={selectedFilter}
            monthLabel={measurementListMonthLabel}
            loading={measurementListLoading}
            canScrollList={canScrollList}
            onFilterChange={setSelectedFilter}
            onMonthPress={() => setMonthSheetVisible(true)}
            onItemPress={handleAnalysisPress}
          />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      <ReportMonthSheet
        visible={monthSheetVisible}
        bottomInset={insets.bottom}
        currentDate={currentMonthDate}
        mode={measurementListMonthMode}
        selectedYear={selectedMeasurementListYear}
        selectedMonth={selectedMeasurementListMonth}
        onClose={() => setMonthSheetVisible(false)}
        onSelectAll={handleSelectAllMonths}
        onSelectSpecificMode={handleSelectSpecificMonthMode}
        onSelectYear={handleSelectMeasurementListYear}
        onSelectMonth={handleSelectMeasurementListMonth}
      />
      <TopScrollGradient visible={topScrollGradient.visible} />

    </View>
  );
}
