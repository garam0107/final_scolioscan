import { i18n } from '@/src/i18n';
import { MuseoModerno_700Bold, useFonts as useMuseoFonts } from '@expo-google-fonts/museomoderno';
import { useFonts as useExpoFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useFocusEffect, useScrollToTop } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetworkErrorView from '@/src/components/NetworkErrorView';
import { useAuth } from '@/src/contexts/AuthContext';
import HomeBanner from '@/src/features/home/components/HomeBanner';
import HomeHeader from '@/src/features/home/components/HomeHeader';
import HomeProModal from '@/src/features/home/components/HomeProModal';
import MeasurementShortcutSection from '@/src/features/home/components/MeasurementShortcutSection';
import type { MeasurementItem } from '@/src/features/home/components/MeasurementCard';

import { useHomeBannerPager } from '@/src/features/home/hooks/useHomeBannerPager';
import { useHomeCurvatureSummary } from '@/src/features/home/hooks/useHomeCurvatureSummary';
import styles, { getHomeMeasurementCardLayout } from '@/src/features/home/home.styles';
import homeHeaderStyles from '@/src/features/home/styles/homeHeader.styles';
import CurvatureSummaryCardRow from '@/src/features/measurementSummary/components/CurvatureSummaryCardRow';
import CurvatureTrendChart from '@/src/features/measurementSummary/components/CurvatureTrendChart';
import TwoIcon from '../../../assets/home/test.svg';
import ScoliometerIcon from '../../../assets/home/home_scolio.svg'
import { useMeasurementGuideStore } from '@/src/store/measurementGuideStore';
const pretendardFont = require('../../../assets/fonts/PretendardVariable.ttf');

export default function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const { loading, isAuthenticated, user, refreshCurrentUser } = useAuth();
  const [museoLoaded] = useMuseoFonts({ MuseoModerno_700Bold });
  const [pretendardLoaded, pretendardError] = useExpoFonts({ PretendardVariable: pretendardFont });
  const [networkError, setNetworkError] = useState(false);
  const [isProModalVisible, setIsProModalVisible] = useState(false);
  const measurementCardLayout = getHomeMeasurementCardLayout(width);
  const trendChartWidth = width - 72;
  const displayName = user?.name?.trim() || i18n.t('회원');
  const { bannerHeight, bannerWidth } = useHomeBannerPager(width);
  const {
    selectedWeeklyResultId,
    setSelectedWeeklyResultId,
    weeklyResults,
    averageChangeText,
    recentChangeText,
    trendPath,
    trendAreaPath,
    hasCurvatureMeasurement,
    loadLatestCurvature,
  } = useHomeCurvatureSummary(trendChartWidth, setNetworkError);
    // measure-guide store 가이드 상태 
  // const measurementGuideCompleted = useMeasurementGuideStore(
  // (state) => state.measurementGuideCompleted,
  // );
  // const guideHydrated = useMeasurementGuideStore((state) => state.hasHydrated);
  const measurementItems: MeasurementItem[] = useMemo(() => [
    {
      id: '2d',
      subtitleLineBreakAfter: '사진 한 장으로',
      title: '카메라 측정하기',
      subtitle: '사진 한 장으로 간편하게 측정',
      remainingText: user ? `${user.curvature_limit}${i18n.t('회 남음')}` : undefined,
      icon: <TwoIcon width={measurementCardLayout.iconSize} height={measurementCardLayout.iconSize} />,
  // 가이드 안봤으면 가이드 화면으로 아니면 바로 측정하기로 가도록 변경
  // onPress: () => {
  //   if (!guideHydrated) return;
  //   router.push(measurementGuideCompleted ? '/measure/2d' : '/measure/guide');
  // }
      onPress: () => { router.push('/measure/2d'); },
    },
    {
      id: 'scoliometer',
      subtitleLineBreakAfter: '스콜리오미터로',
      title: '정교한 측정하기',
      subtitle: '스콜리오미터로 정교한 측정',
      icon: <ScoliometerIcon width={measurementCardLayout.iconSize} height={measurementCardLayout.iconSize} />,
      subtitleColor: '#2E96FF',
      subtitleBackgroundColor: '#EBF5FF',
      locked: hasCurvatureMeasurement === false,
      onPress: () => {router.push('/measure/scoliometer')}
    },
  ], [hasCurvatureMeasurement, measurementCardLayout.iconSize, router, user]);

  const handleNetworkRetry = useCallback(() => {

    void loadLatestCurvature();
  }, [ loadLatestCurvature]);

  useFocusEffect(
    useCallback(() => {
      // 홈으로 돌아올 때 알림 수와 최신 측정 결과를 다시 불러와 탭 간 데이터 차이를 줄인다.
      void loadLatestCurvature();
      void refreshCurrentUser().catch((error) => {
        console.log('[home] 사용자 측정 횟수 갱신 실패', error);
      });
    }, [loadLatestCurvature, refreshCurrentUser]),
  );

  // 현재 선택된 홈 탭을 다시 누르면 홈 메인 스크롤만 맨 위로 이동한다.
  useScrollToTop(scrollRef);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !museoLoaded || (!pretendardLoaded && !pretendardError)) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top', 'left', 'right']}>
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>{i18n.t("화면을 불러오는 중입니다...")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (networkError) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <NetworkErrorView onRetry={handleNetworkRetry} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.page}>
        <HomeHeader
          showFontWarning={Boolean(pretendardError)}
        />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 0 }]}
        >
          <View style={homeHeaderStyles.greetingBlock}>
            <View style={homeHeaderStyles.greetingTitleRow}>
              <Text style={homeHeaderStyles.greetingTitle}>{displayName}{i18n.t("님 안녕하세요.")}</Text>
                                     {/* 분석 중 화면 테스트로 바로 볼려면 주석 해제 */}
              {/* <PrimaryButton
                title="분석중 보기"
                onPress={() => router.push('/measure/scoliometer')}
                width={94}
                height={32}
                backgroundColor="#2C9696"
                borderRadius={6}
              /> */}
            </View>
            <Text style={homeHeaderStyles.greetingSubtitle}>{i18n.t("점점 좋아지고 있어요. 화이팅! 🔥")}</Text>
          </View>
    
          <MeasurementShortcutSection
            items={measurementItems}
            layout={measurementCardLayout}
            onProPress={() => setIsProModalVisible(true)}
          />

          <HomeBanner width={bannerWidth} height={bannerHeight} />

          <View style={styles.weeklySection}>
            <Text style={styles.sectionHeading}>{i18n.t("최근 1개월 측정 결과")}</Text>
            <CurvatureSummaryCardRow
              items={weeklyResults}
              selectedKey={selectedWeeklyResultId}
              onSelect={setSelectedWeeklyResultId}
            />

            <CurvatureTrendChart
              chartWidth={trendChartWidth}
              averageChangeText={averageChangeText}
              recentChangeText={recentChangeText}
              trendPath={trendPath}
              trendAreaPath={trendAreaPath}
              xAxisLabels={['한 달 전', '3주 전', '2주 전', '1주 전', '오늘']}
              gradientId="homeTrendAreaGradient"
            />
          </View>

          <View style={styles.contentSlot} />
        </ScrollView>

        <HomeProModal
          visible={isProModalVisible}
          onClose={() => setIsProModalVisible(false)}
          onSubscribePress={() => {
            router.push('/settings/subscribe');
            setIsProModalVisible(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
