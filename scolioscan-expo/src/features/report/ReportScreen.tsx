import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
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
import { isFutureMonth } from '@/src/features/report/utils/reportMonthFilter';
import type {
  ReportMeasurementFilterKey,
  ReportMeasurementListItem,
} from '@/src/features/report/utils/reportMeasurementListTypes';
import {
  getPeriodOption,
  TREND_PERIOD_OPTIONS,
  type TrendAngleKey,
  type TrendPeriodKey,
} from '@/src/features/report/reportTrend';
import NetworkErrorView from '@/src/components/NetworkErrorView';

// 측정 목록 제목이 화면 상단에 걸리는 기준점이다. SafeAreaView 안쪽 기준이라 값을 키우면 상단에서 더 떨어진다.
const MEASUREMENT_LIST_STICKY_TOP = 12;
// 내부 카드 스크롤 영역이 하단 탭바와 너무 붙지 않도록 남겨두는 여백이다.
const MEASUREMENT_LIST_BOTTOM_RESERVED = 20;
// 화면이 작거나 측정 중인 높이가 아직 0일 때도 목록 영역이 너무 작아지지 않게 하는 최소 높이다.
const MIN_MEASUREMENT_LIST_AREA_HEIGHT = 120;

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
    networkError: curvatureNetworkError,
    reload: reloadCurvatureData,
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
    networkError: measurementListNetworkError,
    reload: reloadMeasurementList,
  } = useReportMeasurementList({
    monthMode: measurementListMonthMode,
    selectedYear: selectedMeasurementListYear,
    selectedMonth: selectedMeasurementListMonth,
    selectedFilter,
  });
  // 네트워크 오류 통합
  const hasNetworkError = curvatureNetworkError || measurementListNetworkError;
  // 네트워크 오류 시 재시도 함수
  const handleNetworkRetry = () => {
    reloadCurvatureData();
    reloadMeasurementList();
  };
  const topScrollGradient = useTopScrollGradient();
  const [canScrollList, setCanScrollList] = useState(false);
  const canScrollListRef = useRef(false);
  // 외부 ScrollView의 현재 위치를 저장해서 레이아웃 재계산 후에도 내부 스크롤 상태를 다시 판단한다.
  const outerScrollYRef = useRef(0);
  // 측정 목록 섹션이 전체 리포트 콘텐츠 안에서 시작되는 y 위치다.
  const [measurementListY, setMeasurementListY] = useState(0);
  // 측정 목록 섹션 안에서 카드 리스트 영역이 시작되는 y 위치다. 제목과 탭 높이를 제외한 남은 높이 계산에 쓴다.
  const [listAreaOffsetY, setListAreaOffsetY] = useState(0);
  // 실제 카드 묶음의 전체 높이다. 이 값이 남은 화면보다 클 때만 내부 스크롤이 필요하다.
  const [listContentHeight, setListContentHeight] = useState(0);
  // 외부 ScrollView의 화면 높이와 전체 콘텐츠 높이다. 측정 목록 제목이 상단까지 올라갈 수 있는지 판단한다.
  const [outerScrollMetrics, setOuterScrollMetrics] = useState({
    viewportHeight: 0,
    contentHeight: 0,
  });

  // 현재 선택된 리포트 탭을 다시 누르면 메인 스크롤만 맨 위로 올린다.
  useScrollToTop(scrollRef);

  const selectedPeriodLabel = getPeriodOption(selectedTrendPeriod).label;
  const measurementListMonthLabel =
    measurementListMonthMode === 'all'
      ? '전체'
      : `${selectedMeasurementListYear}년 ${selectedMeasurementListMonth}월`;
  // 측정 목록 제목이 상단 기준점까지 올라오는 외부 스크롤 위치다.
  const measurementListLockY = Math.max(0, measurementListY - MEASUREMENT_LIST_STICKY_TOP);
  // 측정 목록 제목과 탭이 위쪽에 자리 잡은 뒤, 실제 카드 리스트가 사용할 수 있는 화면 높이다.
  const availableListAreaHeight = Math.max(
    MIN_MEASUREMENT_LIST_AREA_HEIGHT,
    outerScrollMetrics.viewportHeight -
      MEASUREMENT_LIST_STICKY_TOP -
      listAreaOffsetY -
      MEASUREMENT_LIST_BOTTOM_RESERVED,
  );
  // 카드가 적으면 외부 스크롤 자체가 lock 위치까지 도달하지 못하므로 내부 스크롤을 켜면 안 된다.
  const canReachMeasurementListTop =
    outerScrollMetrics.contentHeight - outerScrollMetrics.viewportHeight >= measurementListLockY - 1;
  // 카드 묶음이 남은 화면보다 길고, 측정 목록 제목도 상단 기준점까지 도달 가능할 때만 내부 스크롤을 사용한다.
  const shouldUseInnerListScroll =
    listContentHeight > availableListAreaHeight + 1 && canReachMeasurementListTop;
  // 내부 스크롤이 필요할 때만 높이를 고정한다. 필요 없으면 undefined로 두어 전체 스크롤이 자연스럽게 처리한다.
  const measurementListAreaHeight = shouldUseInnerListScroll ? availableListAreaHeight : undefined;

  const updateCanScrollList = useCallback((scrollY: number) => {
    // 측정 목록이 상단 기준까지 올라갈 수 있고, 카드가 남은 화면보다 많을 때만 내부 스크롤을 켠다.
    const nextCanScrollList = shouldUseInnerListScroll && scrollY >= measurementListLockY - 1;

    if (canScrollListRef.current !== nextCanScrollList) {
      canScrollListRef.current = nextCanScrollList;
      setCanScrollList(nextCanScrollList);
    }
  }, [measurementListLockY, shouldUseInnerListScroll]);

  useEffect(() => {
    // 측정 목록 카드 수나 화면 높이가 바뀌면 현재 스크롤 위치 기준으로 내부 스크롤 가능 여부를 다시 맞춘다.
    updateCanScrollList(outerScrollYRef.current);
  }, [updateCanScrollList]);

  const handleOuterScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    topScrollGradient.onScroll(event);

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    outerScrollYRef.current = contentOffset.y;

    setOuterScrollMetrics((current) => {
      // 높이가 실질적으로 변하지 않았으면 상태 업데이트를 막아 불필요한 렌더링을 줄인다.
      if (
        Math.abs(current.viewportHeight - layoutMeasurement.height) < 1 &&
        Math.abs(current.contentHeight - contentSize.height) < 1
      ) {
        return current;
      }

      return {
        viewportHeight: layoutMeasurement.height,
        contentHeight: contentSize.height,
      };
    });
    updateCanScrollList(contentOffset.y);
  };

  const handleMeasurementListLayout = (event: LayoutChangeEvent) => {
    // 전체 콘텐츠 안에서 측정 목록 제목이 어디서 시작되는지 저장한다.
    setMeasurementListY(event.nativeEvent.layout.y);
  };

  const handleListAreaLayout = (event: LayoutChangeEvent) => {
    // 측정 목록 제목과 탭을 제외한 카드 영역의 시작 위치를 저장한다.
    setListAreaOffsetY(event.nativeEvent.layout.y);
  };

  const handleAnalysisPress = (item: ReportMeasurementListItem) => {
    // 상세 화면은 현재 만곡 결과 아이디를 경로 파라미터로 받아 다시 조회한다.
    if (!item.navigationId) return;
    router.push({
      pathname: '/analysis-detail/[id]',
      params: {
        id: item.navigationId,
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
  if (hasNetworkError) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
          <NetworkErrorView onRetry={handleNetworkRetry} />
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
            listAreaHeight={measurementListAreaHeight}
            onSectionLayout={handleMeasurementListLayout}
            onListAreaLayout={handleListAreaLayout}
            onListContentHeightChange={setListContentHeight}
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
