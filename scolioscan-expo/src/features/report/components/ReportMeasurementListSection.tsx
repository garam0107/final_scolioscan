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
import styles from '@/src/features/report/components/reportMeasurementList.styles';
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
  onFilterChange,
  onMonthPress,
  onItemPress,
}: ReportMeasurementListSectionProps) {
  const [tabsWidth, setTabsWidth] = useState(0);
  const animatedTab = useMemo(() => new Animated.Value(0), []);
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

  const handleTabsLayout = (event: LayoutChangeEvent) => {
    setTabsWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>측정 목록</Text>
        <Pressable
          style={({ pressed }) => [styles.monthSelectButton, pressed && styles.pressed]}
          onPress={onMonthPress}
        >
          <Text style={styles.monthSelectText}>{monthLabel}</Text>
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
          !loading && items.length === 0 ? styles.listAreaEmpty : null,
        ]}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#69B7BC" />
          </View>
        ) : items.length > 0 ? (
          <ScrollView
            scrollEnabled={canScrollList}
            nestedScrollEnabled={canScrollList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listScrollContent}
          >
            <View style={styles.list}>
              {items.map((item) => (
                <ReportMeasurementCard key={item.id} item={item} onPress={onItemPress} />
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyBox}>
      
            <Text style={styles.emptyText}>측정 결과가 없어요.</Text>
          </View>
        )}
      </View>
    </View>
  );
}
