import { i18n } from '@/src/i18n';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import ReportMeasurementCard from '@/src/features/report/components/ReportMeasurementCard';
import styles from '@/src/features/report/styles/reportMeasurementList.styles';
import {
  REPORT_MEASUREMENT_FILTERS,
  type ReportMeasurementFilterKey,
  type ReportMeasurementListItem,
} from '@/src/features/report/utils/reportMeasurementListTypes';

type ReportMeasurementListSectionProps = {
  items: ReportMeasurementListItem[];
  selectedFilter: ReportMeasurementFilterKey;
  monthLabel: string;
  loading: boolean;
  canScrollList: boolean;
  // 값이 있으면 카드 영역을 고정 높이로 만들고 내부 ScrollView를 사용한다.
  listAreaHeight?: number;
  // 부모 화면에서 측정 목록 제목이 전체 콘텐츠의 어디에 있는지 계산할 때 사용한다.
  onSectionLayout?: (event: LayoutChangeEvent) => void;
  // 제목과 탭을 제외한 카드 영역의 시작 위치를 부모 화면에 전달한다.
  onListAreaLayout?: (event: LayoutChangeEvent) => void;
  // 카드 묶음의 실제 높이를 부모 화면에 전달해서 내부 스크롤 필요 여부를 판단한다.
  onListContentHeightChange?: (height: number) => void;
  onFilterChange: (filter: ReportMeasurementFilterKey) => void;
  onMonthPress: () => void;
  onItemPress: (item: ReportMeasurementListItem) => void;
};

export default function ReportMeasurementListSection({
  items,
  selectedFilter,
  monthLabel,
  loading,
  canScrollList,
  listAreaHeight,
  onSectionLayout,
  onListAreaLayout,
  onListContentHeightChange,
  onFilterChange,
  onMonthPress,
  onItemPress,
}: ReportMeasurementListSectionProps) {
  const [tabsWidth, setTabsWidth] = useState(0);
  const animatedTab = useMemo(() => new Animated.Value(0), []);
  const activeTabColor = '#2C9696'
 
  const activeIndicatorColor ='#2C9696'
   
  const tabWidth = tabsWidth > 0 ? tabsWidth / REPORT_MEASUREMENT_FILTERS.length : 0;
  const translateX = tabWidth
    ? animatedTab.interpolate({
        inputRange: REPORT_MEASUREMENT_FILTERS.map((_, index) => index),
        outputRange: REPORT_MEASUREMENT_FILTERS.map((_, index) => tabWidth * index),
      })
    : 0;

  useEffect(() => {
    const targetIndex = REPORT_MEASUREMENT_FILTERS.findIndex((item) => item.key === selectedFilter);
    if (targetIndex < 0) return;

    Animated.timing(animatedTab, {
      toValue: targetIndex,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedTab, selectedFilter]);

  useEffect(() => {
    if (loading || items.length === 0) {
      // 로딩 중이거나 목록이 비어 있으면 이전 카드 높이가 남아 내부 스크롤이 켜지지 않도록 초기화한다.
      onListContentHeightChange?.(0);
    }
  }, [items.length, loading, onListContentHeightChange]);

  const handleTabsLayout = (event: LayoutChangeEvent) => {
    setTabsWidth(event.nativeEvent.layout.width);
  };

  const handleListContentLayout = (event: LayoutChangeEvent) => {
    // 카드 개수나 카드 높이가 바뀌면 실제 콘텐츠 높이를 다시 부모 화면에 알려준다.
    onListContentHeightChange?.(event.nativeEvent.layout.height);
  };

  const listContent = (
    <View style={styles.list} onLayout={handleListContentLayout}>
      {items.map((item) => (
        <ReportMeasurementCard key={item.id} item={item} onPress={onItemPress} />
      ))}
    </View>
  );

  return (
    <View style={styles.section} onLayout={onSectionLayout}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{i18n.t("측정 목록")}</Text>
        <Pressable
          style={({ pressed }) => [styles.monthSelectButton, pressed && styles.pressed]}
          onPress={onMonthPress}
        >
          <Text style={styles.monthSelectText}>{i18n.t(monthLabel)}</Text>
        </Pressable>
      </View>

      <View style={styles.tabsWrap} onLayout={handleTabsLayout}>
        <View style={styles.tabs}>
          {REPORT_MEASUREMENT_FILTERS.map((filter) => {
            const tabIndex = REPORT_MEASUREMENT_FILTERS.findIndex((item) => item.key === filter.key);
            const color = animatedTab.interpolate({
              inputRange: [tabIndex - 1, tabIndex, tabIndex + 1],
              outputRange: ['#000000', activeTabColor, '#000000'],
              extrapolate: 'clamp',
            });

            return (
              <Pressable
                key={filter.key}
                onPress={() => onFilterChange(filter.key)}
                style={styles.tabButton}
              >
                <Animated.Text style={[styles.tabText, { color }]}>{i18n.t(filter.label)}</Animated.Text>
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
                backgroundColor: activeIndicatorColor,
                transform: [{ translateX: translateX as never }],
              },
            ]}
          />
        ) : null}
      </View>

      <View
        style={[
          styles.listArea,
          listAreaHeight ? { height: listAreaHeight } : null,
          !loading && items.length === 0 ? styles.listAreaEmpty : null,
        ]}
        onLayout={onListAreaLayout}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#69B7BC" />
          </View>
        ) : items.length > 0 && listAreaHeight ? (
          // 카드가 화면에 다 들어가지 않을 때만 내부 ScrollView를 사용한다.
          <ScrollView
            scrollEnabled={canScrollList}
            nestedScrollEnabled={canScrollList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listScrollContent}
          >
            {listContent}
          </ScrollView>
        ) : items.length > 0 ? (
          // 카드가 적을 때는 내부 스크롤을 만들지 않고 전체 화면 스크롤에 맡긴다.
          <View style={styles.listScrollContent}>{listContent}</View>
        ) : (
          <View style={styles.emptyBox}>
      
            <Text style={styles.emptyText}>{i18n.t("측정 결과가 없어요.")}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
