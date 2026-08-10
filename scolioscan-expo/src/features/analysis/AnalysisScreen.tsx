import { i18n } from '@/src/i18n';
import { useMemo, useRef } from 'react';
import {
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';
import { useIsFocused, useScrollToTop } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MeasurementRequiredCard from '@/src/components/MeasurementRequiredCard';
import NetworkErrorView from '@/src/components/NetworkErrorView';
import TopScrollGradient, { useTopScrollGradient } from '@/src/components/TopScrollGradient';
import { useAuth } from '@/src/contexts/AuthContext';
import type { InfoCardLevel } from './analysisCopy';
import styles from './styles/analysis.styles';
import { createAnalysisPose } from './analysisPose';
import AnalysisStage from './components/AnalysisStage';
import AnalysisMeasurementActionCard from './components/AnalysisMeasurementActionCard';
import ReportAiDoctorCard from '@/src/features/report/components/ReportAiDoctorCard';
import CurvePatternCard from './components/CurvePatternCard';
import DominantCurveCard from './components/DominantCurveCard';
import InfoCard from './components/InfoCard';
import SeverityCard from './components/SeverityCard';
import {
  classifyDominantCurve,
  getDominantCurveInfo,
} from './severity';
import { useAnalysisAnimation } from './hooks/useAnalysisAnimation';
import { useAnalysisData } from './hooks/useAnalysisData';

const SPINE_BONE_SIZE = 72;
const SPINE_BONE_SPACING = 24;
const WIDE_LAYOUT_MIN_WIDTH = 600;
const BASE_STAGE_WIDTH = 420;
const BASE_STAGE_HEIGHT = 380;
const STAGE_HORIZONTAL_PADDING = 20;
const MEDICAL_DISCLAIMER_KEY = '의료 관련 고지\n본 서비스는 의료행위 또는 의료기기가 아니며,\n진단, 치료 또는 예방을 목적으로 하지 않습니다.\n제공되는 정보는 참고용이며,\n건강 관련 판단은 반드시 의료 전문가와 상담하시기 바랍니다.';
type AnalysisScreenProps = {
  analysisId?: string;
};

function getWideStageScale(width: number, height: number) {
  if (width < WIDE_LAYOUT_MIN_WIDTH) return 1;

  const availableStageWidth = Math.max(1, width - 32 - STAGE_HORIZONTAL_PADDING);
  const widthScale = availableStageWidth / BASE_STAGE_WIDTH;
  const heightScale = Math.max(1, (height - 180) / BASE_STAGE_HEIGHT);
  

  // 태블릿에서는 화면을 꽉 쓰되 첫 화면에서 과하게 커지지 않도록 가로/세로 중 작은 배율을 사용한다.
  return Math.max(1, Math.min(widthScale, heightScale));
}


export default function AnalysisScreen({ analysisId }: AnalysisScreenProps) {
  const { width, height } = useWindowDimensions();
  const isFocused = useIsFocused();
  const router = useRouter();
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const {
    analysis,
    measurementSet,
    // 구독 상품 재개 시 아래 구독 상태를 다시 사용한다.
    // hasActiveSubscription,
    loading,
    error,
    networkError,
    reloadAnalysisData,
  } = useAnalysisData({ analysisId });

 
  const {
    progress,
    angleAnimationKey,
  } = useAnalysisAnimation({
    hasAnalysis: Boolean(analysis),
    loading,
    error,
  });
  const topScrollGradient = useTopScrollGradient();

  const pose = useMemo(() => createAnalysisPose(analysis), [analysis]);
  const wideStageScale = getWideStageScale(width, height);
  const isWideLayout = width >= WIDE_LAYOUT_MIN_WIDTH;
  const cardWidth = Math.min(width - 24, 440);
  const stageWidth = isWideLayout ? BASE_STAGE_WIDTH * wideStageScale : cardWidth - 20;
  const stageHeight = isWideLayout ? BASE_STAGE_HEIGHT * wideStageScale : BASE_STAGE_HEIGHT;
  const stageBoneSize = SPINE_BONE_SIZE * wideStageScale;
  const stageBoneSpacing = SPINE_BONE_SPACING * wideStageScale;
  const metricSideInset = isWideLayout ? 52 * wideStageScale : 52;
  const summaryName = user?.name?.trim() || i18n.t('회원');
  const upperValue = pose.metrics.find((metric) => metric.key === 'upper')?.value ?? 0;
  const mainValue = pose.metrics.find((metric) => metric.key === 'main')?.value ?? 0;
  const lumbarValue = pose.metrics.find((metric) => metric.key === 'lumbar')?.value ?? 0;

  const maxCobbValue = Math.max(
    Math.abs(upperValue),
    Math.abs(mainValue),
    Math.abs(lumbarValue),
  );

  const infoCardLevel = getInfoCardLevel(maxCobbValue);
  const severityLabel = infoCardLevel;
  const shouldShowMeasurementRequired = !loading && !analysis && !error && !networkError;
  const hasRotation = measurementSet?.rotation !== null && measurementSet?.rotation !== undefined;
  // 구독 상품이 다시 생기면 아래 구독 분기와 안내 카드 주석을 해제한다.
  // const shouldShowMeasurementAction = Boolean(analysis) && (!hasActiveSubscription || !hasRotation);
  // const metricBlurMode = !hasActiveSubscription
  //   ? 'all'
  //   : !hasRotation
  //     ? 'rotation-only'
  //     : 'none';
  // const handleMeasurementActionPress = () => {
  //   router.push(hasActiveSubscription ? '/home' : '/settings/subscribe');
  // };
  // 현재는 구독 없이 모든 사용자가 분석 수치를 볼 수 있도록 블러를 사용하지 않는다.
  const metricBlurMode = 'none' as const;
  const shouldShowRotationMeasurementAction = Boolean(analysis) && !hasRotation;

  const handleRotationMeasurementPress = () => {
    // 비틀림이 없는 경우에는 기존 측정 화면으로 이동한다.
    router.push('/home');
  };
  function getInfoCardLevel(value: number): InfoCardLevel {
    const maxValue = Math.abs(value);
    if (maxValue < 15) return '정상';
    if (maxValue < 25) return '경도';
    if (maxValue < 45) return '중등도';
    return '고도';
  }

  // back_type 우선, 없으면 클라이언트 분류 — 인자 순서: (secondary, main, lumbar) = (upper, main, lumbar)
  const dominantCurve = useMemo(() => {
    // 서버가 제공한 back_type을 우선 사용하고, 없을 때만 현재 각도로 클라이언트 분류를 수행한다.
    if (analysis?.back_type) return getDominantCurveInfo(analysis.back_type);
    return classifyDominantCurve(upperValue, mainValue, lumbarValue);
  }, [analysis?.back_type, upperValue, mainValue, lumbarValue]);

  // 현재 선택된 분석 탭을 다시 누르면 보던 위치와 상관없이 맨 위로 이동한다.
  useScrollToTop(scrollRef);
  if (loading) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
          <StatusBar style="dark" backgroundColor="#F4F6F7" translucent={false} />
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#69B7BC" />
            <Text style={styles.loadingText}>{i18n.t("분석 결과를 불러오는 중입니다...")}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (networkError) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
          <StatusBar style="dark" backgroundColor="#F4F6F7" translucent={false} />
          <NetworkErrorView onRetry={reloadAnalysisData} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right', ]} style={styles.safeArea}>
        <StatusBar style="dark" backgroundColor="#F4F6F7" translucent={false} />

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          showsVerticalScrollIndicator
          onScroll={topScrollGradient.onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.content,
            shouldShowMeasurementRequired ? styles.measurementRequiredContent : null,
            styles.contentInset,
          ]}
        >
          {shouldShowMeasurementRequired ? (
            <MeasurementRequiredCard />
          ) : (
            <>
          <View style={styles.summaryTextBlock}>
            <Text style={styles.summaryNameLine}>{summaryName}{i18n.t("님은")}</Text>
            <Text style={styles.summaryDiagnosisLine}>
              <Text style={styles.summarySeverityBold}>
                {i18n.t('analysis.scoliosisAssessment', { severity: i18n.t(severityLabel) })}
              </Text>
              {i18n.t("으로 예상 됩니다")}
            </Text>
          </View>

          <AnalysisStage
            pose={pose}
            stageHeight={stageHeight}
            stageWidth={stageWidth}
            stageBoneSize={stageBoneSize}
            stageBoneSpacing={stageBoneSpacing}
            wideStageScale={wideStageScale}
            metricSideInset={metricSideInset}
            hasAnalysis={Boolean(analysis)}
            loading={loading}
            error={error}
            angleAnimationKey={angleAnimationKey}
            progress={progress}
            viewMode="3d"
            measurementSet={measurementSet}
            metricBlurMode={metricBlurMode}
            screenFocused={isFocused}
            backgroundImageSource={null}
            onRetry={reloadAnalysisData}
          />
          {shouldShowRotationMeasurementAction ? (
            <AnalysisMeasurementActionCard
              subscribed
              onPress={handleRotationMeasurementPress}
            />
          ) : null}
          <InfoCard level={infoCardLevel} />

          <SeverityCard metrics={pose.metrics} metricBlurMode={metricBlurMode} />

          <DominantCurveCard
            dominantCurve={dominantCurve}
            summaryName={summaryName}
            isWideLayout={isWideLayout}
            wideStageScale={wideStageScale}
          />

          <CurvePatternCard dominantCurve={dominantCurve} />

          <ReportAiDoctorCard latestCurvature={measurementSet?.curvature ?? null} />

          {/* 분석 결과를 해석하기 전 의료 관련 고지를 확인할 수 있도록 콘텐츠 마지막에 배치한다. */}
          <View style={styles.medicalDisclaimer}>
            <Text style={styles.medicalDisclaimerText}>{i18n.t(MEDICAL_DISCLAIMER_KEY)}</Text>
          </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      <TopScrollGradient visible={topScrollGradient.visible} />
    </View>
  );
}
