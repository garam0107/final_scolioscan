import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MeasurementRequiredCard from '@/src/components/MeasurementRequiredCard';
import TopScrollGradient, { useTopScrollGradient } from '@/src/components/TopScrollGradient';
import { useReportMeasurementListFilterStore } from '@/src/store/reportMeasurementListFilterStore';
import ReportAiDoctorCard from '@/src/features/report/components/ReportAiDoctorCard';
import ReportMeasurementListSection from '@/src/features/report/components/ReportMeasurementListSection';
import ReportMonthSheet from '@/src/features/report/components/ReportMonthSheet';
import ReportTrendChart from '@/src/features/report/components/ReportTrendChart';
import ReportEmptyOverlay from '@/src/features/report/components/ReportEmptyOverlay';
import ReportSummaryCard from '@/src/features/report/components/ReportSummaryCard';
import ReportTriangleChart from '@/src/features/report/components/ReportTriangleChart';
import { useReportCurvatureData } from '@/src/features/report/hooks/useReportCurvatureData';
import { useReportMeasurementList } from '@/src/features/report/hooks/useReportMeasurementList';
import styles from '@/src/features/report/report.styles';
import { isFutureMonth } from '@/src/features/report/reportMonthFilter';
import type {
  ReportMeasurementFilterKey,
  ReportMeasurementListItem,
} from '@/src/features/report/reportMeasurementListTypes';
import {
  getPeriodOption,
  TREND_PERIOD_OPTIONS,
  type TrendAngleKey,
  type TrendPeriodKey,
} from '@/src/features/report/reportTrend';

export default function ReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentMonthDate = useMemo(() => new Date(), []);
  const {
    curvatures,
    loading,
    latestCurvature,
    hasCurvatureData,
    myValues,
    avgValues,
    summaryCards,
  } = useReportCurvatureData();
  const [selectedFilter, setSelectedFilter] = useState<ReportMeasurementFilterKey>('all');
  const [selectedReportAngle, setSelectedReportAngle] = useState<TrendAngleKey>('proximal');
  const [selectedTrendPeriod, setSelectedTrendPeriod] = useState<TrendPeriodKey>('month1');
  const [periodDropdownVisible, setPeriodDropdownVisible] = useState(false);
  const [monthSheetVisible, setMonthSheetVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const measurementListMonthMode = useReportMeasurementListFilterStore((state) => state.monthMode);
  const selectedMeasurementListYear = useReportMeasurementListFilterStore((state) => state.selectedYear);
  const selectedMeasurementListMonth = useReportMeasurementListFilterStore((state) => state.selectedMonth);
  const setMeasurementListMonthMode = useReportMeasurementListFilterStore((state) => state.setMonthMode);
  const setSelectedMeasurementListYear = useReportMeasurementListFilterStore((state) => state.setSelectedYear);
  const setSelectedMeasurementListMonth = useReportMeasurementListFilterStore((state) => state.setSelectedMonth);
  const {
    loading: measurementListLoading,
    filteredItems,
  } = useReportMeasurementList({
    monthMode: measurementListMonthMode,
    selectedYear: selectedMeasurementListYear,
    selectedMonth: selectedMeasurementListMonth,
    selectedFilter,
  });
  const topScrollGradient = useTopScrollGradient();
  // 외부 스크롤 위치 감지하여, 끝에 도달하기 전까지 측정 목록 스크롤 비활성화
  const [canScrollList, setCanScrollList] = useState(false);
  const canScrollListRef = useRef(false);

  // 현재 선택된 리포트 탭을 다시 누르면 메인 스크롤만 맨 위로 올린다.
  useScrollToTop(scrollRef);

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
             <ReportTriangleChart
              myValues={myValues}
              avgValues={avgValues}
              labels={['상부 흉추 각도', '주 흉추 각도', '요추 각도']}
              myMeasurementLabel="내 측정값"
              avgLabel="한국인 평균 측정값"
              chartDescriptionText="중심에 가까울수록 정상 범위에 가깝습니다."
            />

            {!loading && !hasCurvatureData ? <ReportEmptyOverlay onPress={handleGoHome} /> : null}
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
              <ReportSummaryCard
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
