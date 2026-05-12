import { MuseoModerno_700Bold, useFonts as useMuseoFonts } from '@expo-google-fonts/museomoderno';
import { useFonts as useExpoFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ImageBackground,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import CrownIcon from '../../../assets/home/crown.svg';
import { alarmAPI } from '@/src/api/alarm';
import { curvatureAPI } from '@/src/api/curvature';
import { useAuth } from '@/src/contexts/AuthContext';
import { HomeNotificationIcon } from '@/src/features/home/homeIcons';
import styles from '@/src/features/home/home.styles';
import type { CurvatureResponse } from '@/src/types/curvature';
import ThreeDCameraIcon from '../../../assets/icons/3D_camera.svg';
import TwoIcon from '../../../assets/home/test.svg'
import ThreeIcon from '../../../assets/home/home_3d_camera.svg'
import PrimaryButton from '@/src/components/ui/PrimaryButton';
const pretendardFont = require('../../../assets/fonts/PretendardVariable.ttf');
const banner1 = require('../../../assets/images/BannerImage1.png');


type MeasurementItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress?: () => void;
  pro?: boolean;
  subtitleColor?: string;
  subtitleBackgroundColor?: string;
};

type MeasurementCardProps = MeasurementItem & {
  cardWidth: number;
};

type WeeklyResultItem = {
  id: WeeklyResultId;
  label: string;
  value: number;
};

type WeeklyResultId = 'upper-thoracic' | 'main-thoracic' | 'lumbar';

type WeeklyResultValues = {
  upperThoracic: number;
  mainThoracic: number;
  lumbar: number;
};

type TrendChartPoint = {
  x: number;
  y: number;
};

const INITIAL_WEEKLY_RESULT_VALUES: WeeklyResultValues = {
  upperThoracic: 0,
  mainThoracic: 0,
  lumbar: 0,
};

const RECENT_CURVATURE_DAYS = 30;
const TREND_CHART_HEIGHT = 120;
const TREND_CHART_MAX_VALUE = 40;

function formatAngleValue(value: number) {
  // 서버 값이 비정상이어도 홈 카드와 차트 계산이 깨지지 않게 보정한다.
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 10) / 10;
}

function formatChangeAngle(value: number, showPlus = false) {
  const angle = formatAngleValue(Math.abs(value));
  const sign = showPlus
    ? value > 0
      ? '+'
      : value < 0
        ? '-'
        : ''
    : '';

  return `${sign}${angle}°`;
}

function getSelectedCurvatureValue(record: CurvatureResponse, selectedId: WeeklyResultId) {
  // 화면 카드의 선택값을 서버 응답의 실제 만곡 필드와 연결한다.
  if (selectedId === 'upper-thoracic') {
    return record.secondary_thoracic_cobb;
  }

  if (selectedId === 'main-thoracic') {
    return record.main_thoracic_cobb;
  }

  return record.lumbar_cobb;
}

function getMeasurementDate(record: Pick<CurvatureResponse, 'measured_at' | 'created_at'>) {
  return record.measured_at || record.created_at;
}

function formatDateParam(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getRecentDateRange(days: number) {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - (days - 1));

  return {
    from_date: formatDateParam(fromDate),
    to_date: formatDateParam(toDate),
  };
}

function getRecentDateRangeDates(days: number) {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate };
}

function filterRecentCurvatureRecords(records: CurvatureResponse[]) {
  // 홈 추세는 최근 30일만 보여주므로 범위 밖 측정값은 제외한다.
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (RECENT_CURVATURE_DAYS - 1));
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return records.filter((record) => {
    const measurementDate = new Date(getMeasurementDate(record));
    return measurementDate >= startDate && measurementDate <= endDate;
  });
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getDailyLatestCurvatureRecords(records: CurvatureResponse[]) {
  // 같은 날 여러 번 측정한 경우 가장 최신 측정만 하루 대표값으로 사용한다.
  const latestByDay = new Map<string, CurvatureResponse>();

  records.forEach((record) => {
    const measurementDate = new Date(getMeasurementDate(record));
    const dateKey = getDateKey(measurementDate);
    const current = latestByDay.get(dateKey);

    if (!current) {
      latestByDay.set(dateKey, record);
      return;
    }

    const currentTime = new Date(getMeasurementDate(current)).getTime();
    if (measurementDate.getTime() >= currentTime) {
      latestByDay.set(dateKey, record);
    }
  });

  return Array.from(latestByDay.values()).sort(
    (left, right) => new Date(getMeasurementDate(right)).getTime() - new Date(getMeasurementDate(left)).getTime(),
  );
}

function buildTrendPath(points: TrendChartPoint[]) {
  // 측정점 사이를 부드러운 곡선으로 이어 홈 추세 그래프를 만든다.
  if (points.length === 0) {
    return '';
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y}`;
  }

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

function MeasurementCard({
  title,
  subtitle,
  icon,
  onPress,
  pro,
  subtitleColor,
  subtitleBackgroundColor,
  cardWidth,
}: MeasurementCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.measurementCard, { width: cardWidth }, pressed && styles.pressed]}
    >
      {pro && (
        <View style={styles.proBadge}>
                 <CrownIcon width={10} height={10} />
          <Text style={styles.proBadgeText}>Pro</Text>
        </View>
      )}
      <View style={styles.measurementIconWrap}>{icon}</View>
      <View style={styles.measurementCardContent}>
        <Text style={styles.measurementTitle}>{title}</Text>
        <View style={[styles.measurementBadge, subtitleBackgroundColor ? { backgroundColor: subtitleBackgroundColor } : null]}>
          <Text style={[styles.measurementBadgeText, subtitleColor ? { color: subtitleColor } : null]}>{subtitle}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const bannerScrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const { loading, isAuthenticated, user } = useAuth();
  const [museoLoaded] = useMuseoFonts({ MuseoModerno_700Bold });
  const [pretendardLoaded, pretendardError] = useExpoFonts({ PretendardVariable: pretendardFont });
  const [, setBannerIndex] = useState(0);
  const [alarmCount, setAlarmCount] = useState(user?.alarm_count ?? 0);
  const [isProModalVisible, setIsProModalVisible] = useState(false);
  const [selectedWeeklyResultId, setSelectedWeeklyResultId] = useState<WeeklyResultId>('upper-thoracic');
  const [weeklyResultValues, setWeeklyResultValues] = useState<WeeklyResultValues>(INITIAL_WEEKLY_RESULT_VALUES);
  const [curvatureTrendRecords, setCurvatureTrendRecords] = useState<CurvatureResponse[]>([]);
  const [rawCurvatureTrendRecords, setRawCurvatureTrendRecords] = useState<CurvatureResponse[]>([]);
  const isCompactWidth = width < 390;
  const bannerHeight = isCompactWidth ? 104 : 112;
  const bannerWidth = width - 40;
  const measurementCardWidth = (width - 40 - 8) / 2;
  const trendChartWidth = width - 72;
  const displayName = user?.name?.trim() || '회원';



  const measurementItems: MeasurementItem[] = [
  {
    id: '2d',
    title: '2D 측정하기',
    subtitle: '집에서 간편하게 측정',
    icon: <TwoIcon width={60} height={60} />,
    onPress: () => router.push('/measure/2d'),
  },
  {
    id: '3d',
    title: '3D 동영상 측정',
    subtitle: '영상을 통한 정밀 측정',
    icon: <ThreeIcon width={60} height={60} />,
    pro: true,
    subtitleColor: '#2E96FF',
    subtitleBackgroundColor: '#EBF5FF',
    onPress: () => Alert.alert('준비중', '3D 측정 기능은 다음 화면에서 연결할게요.'),
  },
];
  const weeklyResults: WeeklyResultItem[] = [
    { id: 'upper-thoracic', label: '상부 흉추만곡', value: weeklyResultValues.upperThoracic },
    { id: 'main-thoracic', label: '주 흉추만곡', value: weeklyResultValues.mainThoracic },
    { id: 'lumbar', label: '요추만곡', value: weeklyResultValues.lumbar },
  ];
  const trendRecords = useMemo(
    () => [...curvatureTrendRecords].reverse(),
    [curvatureTrendRecords],
  );
  const trendValues = useMemo(
    () => trendRecords.map((record) => formatAngleValue(getSelectedCurvatureValue(record, selectedWeeklyResultId))),
    [selectedWeeklyResultId, trendRecords],
  );
  const rawTrendRecords = useMemo(
    () =>
      [...rawCurvatureTrendRecords].sort(
        (left, right) =>
          new Date(getMeasurementDate(left)).getTime() - new Date(getMeasurementDate(right)).getTime(),
      ),
    [rawCurvatureTrendRecords],
  );
  const rawTrendValues = useMemo(
    () => rawTrendRecords.map((record) => formatAngleValue(getSelectedCurvatureValue(record, selectedWeeklyResultId))),
    [rawTrendRecords, selectedWeeklyResultId],
  );
  const trendPeriodRange = useMemo(
    () => getRecentDateRangeDates(RECENT_CURVATURE_DAYS),
    [],
  );
  const trendPoints = useMemo(() => {
    const startTime = trendPeriodRange.startDate.getTime();
    const endTime = trendPeriodRange.endDate.getTime();
    const rangeTime = Math.max(1, endTime - startTime);

    return trendRecords.map((record) => {
      const measurementTime = new Date(getMeasurementDate(record)).getTime();
      const clampedTime = Math.max(startTime, Math.min(endTime, measurementTime));
      const value = formatAngleValue(getSelectedCurvatureValue(record, selectedWeeklyResultId));
      const safeValue = Math.max(0, Math.min(value, TREND_CHART_MAX_VALUE));

      return {
        x: ((clampedTime - startTime) / rangeTime) * trendChartWidth,
        y: TREND_CHART_HEIGHT - (safeValue / TREND_CHART_MAX_VALUE) * TREND_CHART_HEIGHT,
      };
    });
  }, [selectedWeeklyResultId, trendChartWidth, trendPeriodRange, trendRecords]);
  const trendPath = useMemo(
    () => buildTrendPath(trendPoints),
    [trendPoints],
  );
  const trendAreaPath = useMemo(() => {
    if (!trendPath || trendPoints.length === 0) {
      return '';
    }

    const firstPoint = trendPoints[0];
    const lastPoint = trendPoints[trendPoints.length - 1];

    return `${trendPath} L ${lastPoint.x} ${TREND_CHART_HEIGHT} L ${firstPoint.x} ${TREND_CHART_HEIGHT} Z`;
  }, [trendPath, trendPoints]);
  const recentChange = useMemo(() => {
    if (rawTrendValues.length < 2) {
      return 0;
    }

    const latestTrendValue = rawTrendValues[rawTrendValues.length - 1];
    const previousTrendValue = rawTrendValues[rawTrendValues.length - 2];

    return Number((latestTrendValue - previousTrendValue).toFixed(1));
  }, [rawTrendValues]);
  const averageChange = useMemo(() => {
    const values = trendValues.length >= 2 ? trendValues : rawTrendValues;

    if (values.length < 2) {
      return 0;
    }

    const totalChange = values.slice(1).reduce((sum, value, index) => {
      return sum + Math.abs(value - values[index]);
    }, 0);

    return Number((totalChange / (values.length - 1)).toFixed(1));
  }, [rawTrendValues, trendValues]);

  const loadAlarmCount = useCallback(async () => {
    try {
      const response = await alarmAPI.getUnreadCount();
      console.log('[Home] unread alarm count from API:', response.data.count);
      setAlarmCount(response.data.count);
    } catch (error) {
      console.error('Failed to load alarm count:', error);
    }
  }, []);

  const loadLatestCurvature = useCallback(async () => {
    try {
      // 최근 측정값과 원본 기록을 함께 보관해 카드, 변화량, 차트가 같은 응답을 기준으로 갱신되게 한다.
      const response = await curvatureAPI.getAnalyses({
        limit: 1000,
        ...getRecentDateRange(RECENT_CURVATURE_DAYS),
      });
      const recentCurvatures = filterRecentCurvatureRecords(response.data);
      const dailyLatestCurvatures = getDailyLatestCurvatureRecords(recentCurvatures);
      const latestCurvature = dailyLatestCurvatures[0];
      setRawCurvatureTrendRecords(recentCurvatures);
      setCurvatureTrendRecords(dailyLatestCurvatures);

      if (!latestCurvature) {
        setWeeklyResultValues(INITIAL_WEEKLY_RESULT_VALUES);
        setRawCurvatureTrendRecords([]);
        return;
      }

      setWeeklyResultValues({
        upperThoracic: formatAngleValue(latestCurvature.secondary_thoracic_cobb),
        mainThoracic: formatAngleValue(latestCurvature.main_thoracic_cobb),
        lumbar: formatAngleValue(latestCurvature.lumbar_cobb),
      });
    } catch (error) {
      console.error('Failed to load latest curvature:', error);
      setWeeklyResultValues(INITIAL_WEEKLY_RESULT_VALUES);
      setRawCurvatureTrendRecords([]);
      setCurvatureTrendRecords([]);
    }
  }, []);

  useEffect(() => {
    console.log('[Home] unread alarm count from user:', user?.alarm_count ?? 0);
    setAlarmCount(user?.alarm_count ?? 0);
  }, [user?.alarm_count]);

  useFocusEffect(
    useCallback(() => {
      // 홈으로 돌아올 때 알림 수와 최신 측정 결과를 다시 불러와 탭 간 데이터 차이를 줄인다.
      void loadAlarmCount();
      void loadLatestCurvature();
    }, [loadAlarmCount, loadLatestCurvature]),
  );

  useEffect(() => {
    if (pretendardError) {
      console.error('Pretendard font failed to load:', pretendardError);
    }
  }, [pretendardError]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  const banners = useMemo(() => [banner1, banner1, banner1], []);

  const handleBannerMomentumEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / bannerWidth);
    if (nextIndex >= banners.length) {
      bannerScrollRef.current?.scrollTo({ x: 0, animated: false });
      setBannerIndex(0);
      return;
    }

    setBannerIndex(Math.max(0, Math.min(nextIndex, banners.length - 1)));
  }, [bannerWidth, banners.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((value) => {
        // 마지막 복제 배너까지 이동한 뒤 첫 배너로 되돌려 무한 캐러셀처럼 보이게 한다.
        const isLastBanner = value === banners.length - 1;
        const nextIndex = isLastBanner ? banners.length : value + 1;
        bannerScrollRef.current?.scrollTo({
          x: nextIndex * bannerWidth,
          animated: true,
        });

        if (isLastBanner) {
          setTimeout(() => {
            bannerScrollRef.current?.scrollTo({ x: 0, animated: false });
          }, 450);
          return 0;
        }

        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [bannerWidth, banners.length]);

  if (loading || !museoLoaded || (!pretendardLoaded && !pretendardError)) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top', 'left', 'right',]}>
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>화면을 불러오는 중입니다...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right' , ]}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>ScolioScan</Text>
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push('/notifications')} style={styles.headerIconButton}>
              <HomeNotificationIcon unread={alarmCount > 0} />
            </Pressable>
          </View>
        </View>

        {pretendardError ? (
          <View style={styles.fontWarning}>
            <Text style={styles.fontWarningText}>
              폰트 로딩 실패: 기본 시스템 폰트로 표시 중입니다.
            </Text>
          </View>
        ) : null}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom:  0 }]}
        >
          <View style={styles.greetingBlock}>
            <View style={styles.greetingTitleRow}>
              <Text style={styles.greetingTitle}>{displayName}님 안녕하세요.</Text>
              <PrimaryButton
                title="분석중 보기"
                onPress={() => router.push('/measure-loading-preview')}
                width={94}
                height={32}
                backgroundColor="#2C9696"
                borderRadius={6}
                textStyle={styles.previewButtonText}
              />
            </View>
            <Text style={styles.greetingSubtitle}>점점 좋아지고 있어요. 화이팅! 🔥</Text>
          </View>

          <View style={styles.measurementGrid}>
            {measurementItems.map((item) => (
              <MeasurementCard
                key={item.id}
                {...item}
                cardWidth={measurementCardWidth}
                onPress={item.id === '3d' ? () => setIsProModalVisible(true) : item.onPress}
              />
            ))}
          </View>
         

          <View style={styles.bannerWrap}>
            <ScrollView
              ref={bannerScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleBannerMomentumEnd}
              scrollEventThrottle={16}
              style={[styles.bannerPager, { width: bannerWidth, height: bannerHeight }]}
            >
              {[...banners, banners[0]].map((banner, index) => (
                <View
                  key={`home-banner-${index}`}
                  style={[styles.bannerSlide, { width: bannerWidth, height: bannerHeight }]}
                >
                  <ImageBackground
                    source={banner}
                    style={[styles.banner, { width: bannerWidth, height: bannerHeight }]}
                    imageStyle={styles.bannerImage}
                  >
                    <View style={styles.bannerBadge}>
                      <Text style={styles.bannerBadgeText}>{(index % banners.length) + 1} / {banners.length}</Text>
                    </View>
                  </ImageBackground>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.weeklySection}>
            <Text style={styles.sectionHeading}>최근 1개월 측정 결과</Text>
            <View style={styles.weeklyResultGrid}>
              {weeklyResults.map((item) => {
                const isSelected = selectedWeeklyResultId === item.id;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelectedWeeklyResultId(item.id)}
                    style={({ pressed }) => [
                      styles.weeklyResultCard,
                      isSelected ? styles.weeklyResultCardActive : null,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.weeklyResultLabel, isSelected ? styles.weeklyResultLabelActive : null]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.weeklyResultValue, isSelected ? styles.weeklyResultValueActive : null]}>
                      {item.value}°
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.trendCard}>
              <View style={styles.trendHeader}>
                <View style={styles.trendSummary}>
                  <Text style={styles.trendCaption}>평균 변화량</Text>
                  <View style={styles.trendValueRow}>
                    <Text style={styles.trendAverageValue}>{formatChangeAngle(averageChange)}</Text>
                    <View style={styles.trendChangeBadge}>
                      <Text style={styles.trendChangeText}>최근 변화 {formatChangeAngle(recentChange, true)}</Text>
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

              <View style={styles.trendChartWrap}>
                <Svg width={trendChartWidth} height={TREND_CHART_HEIGHT}>
                  <Defs>
                    <SvgLinearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor="#2E96FF" stopOpacity={0.16} />
                      <Stop offset="100%" stopColor="#2E96FF" stopOpacity={0} />
                    </SvgLinearGradient>
                  </Defs>
                  <Line x1="0" y1={getThresholdY(40)} x2={trendChartWidth} y2={getThresholdY(40)} stroke="#FF4B3C" strokeWidth={1} strokeDasharray="6 6" />
                  <Line x1="0" y1={getThresholdY(25)} x2={trendChartWidth} y2={getThresholdY(25)} stroke="#FABE00" strokeWidth={1} strokeDasharray="6 6" />
                  <Line x1="0" y1={getThresholdY(10)} x2={trendChartWidth} y2={getThresholdY(10)} stroke="#2C9696" strokeWidth={1} strokeDasharray="6 6" />
                  {trendPath ? (
                    <>
                      <Path
                        d={trendAreaPath}
                        fill="url(#trendAreaGradient)"
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

              <View style={styles.trendXAxis}>
                <Text style={styles.trendXAxisText}>한 달 전</Text>
                <Text style={styles.trendXAxisText}>3주 전</Text>
                <Text style={styles.trendXAxisText}>2주 전</Text>
                <Text style={styles.trendXAxisText}>1주 전</Text>
                <Text style={styles.trendXAxisText}>오늘</Text>
              </View>
            </View>
          </View>

          <View style={styles.contentSlot} />
        </ScrollView>

        <Modal
          visible={isProModalVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setIsProModalVisible(false)}
        >
          <View style={styles.proModalOverlay}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setIsProModalVisible(false)} />
            <View style={styles.proModalCard}>
              <View style={styles.proModalHeader}>
                <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
                  <Defs>
                    <SvgLinearGradient id="proModalGradient" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="18%" stopColor="#D6FFFE" />
                      <Stop offset="100%" stopColor="#FFFFFF" />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" fill="url(#proModalGradient)" />
                </Svg>
                <ThreeDCameraIcon width={120} height={120} />
              </View>

              <View style={styles.proModalBody}>
                <Text style={styles.proModalTitle}>
                  3D 동영상 측정을 이용하시려면{'\n'}Pro 모델을 구독해주세요.
                </Text>
                <Text style={styles.proModalSubtitle}>처음 구독하시면 50% 할인해요!</Text>

                <Pressable
                  onPress={() => {
                    setIsProModalVisible(false);
                    Alert.alert('준비중', '구독 페이지는 다음 단계에서 연결할게요.');
                  }}
                  style={({ pressed }) => [styles.proModalButton, pressed && styles.pressed]}
                >
                  <Text style={styles.proModalButtonText}>구독하러 가기</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
