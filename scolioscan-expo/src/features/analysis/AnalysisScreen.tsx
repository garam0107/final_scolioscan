import { useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  Switch,
  Text,
  View,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MeasurementRequiredCard from '@/src/components/MeasurementRequiredCard';
import NetworkErrorView from '@/src/components/NetworkErrorView';
import TopScrollGradient, { useTopScrollGradient } from '@/src/components/TopScrollGradient';
import { useAuth } from '@/src/contexts/AuthContext';
import { getAccessToken } from '@/src/lib/tokenStorage';
import type { InfoCardLevel } from './analysisCopy';
import styles from './styles/analysis.styles';
import { createAnalysisPose } from './analysisPose';
import AiDoctorCard from './components/AiDoctorCard';
import AnalysisStage from './components/AnalysisStage';
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
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;


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
// 분석 카드 배경에 이미지 띄우는 함수 
function getCurvatureImageSource(imagePath?: string | null) {
  if (!API_BASE_URL || !imagePath) return null;

  const fileName = imagePath.split('/').filter(Boolean).pop();

  if (!fileName) return null;

  const token = getAccessToken();

  // ImageBackground는 axios 인터셉터를 거치지 않으므로 이미지 요청에 인증 헤더를 직접 넣습니다.
  return {
    uri: `${API_BASE_URL}/curvature/images/${encodeURIComponent(fileName)}`,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  };
}

export default function AnalysisScreen({ analysisId }: AnalysisScreenProps) {
  const { width, height } = useWindowDimensions();
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const {
    analysis,
    measurementSet,
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
  // 측정 때 사용한 이미지 
  const stageBackgroundSource = useMemo(
    () => getCurvatureImageSource(analysis?.image_url),
    [analysis?.image_url],
  );
  const wideStageScale = getWideStageScale(width, height);
  const isWideLayout = width >= WIDE_LAYOUT_MIN_WIDTH;
  const cardWidth = Math.min(width - 24, 440);
  const stageWidth = isWideLayout ? BASE_STAGE_WIDTH * wideStageScale : cardWidth - 20;
  const stageHeight = isWideLayout ? BASE_STAGE_HEIGHT * wideStageScale : BASE_STAGE_HEIGHT;
  const stageBoneSize = SPINE_BONE_SIZE * wideStageScale;
  const stageBoneSpacing = SPINE_BONE_SPACING * wideStageScale;
  const metricSideInset = isWideLayout ? 52 * wideStageScale : 52;
  const summaryName = user?.name?.trim() || '회원';
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
  // 2D,3D 토글
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');  
  const is3DView = viewMode === '3d';
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
            <Text style={styles.loadingText}>분석 결과를 불러오는 중입니다...</Text>
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
            <Text style={styles.summaryNameLine}>{summaryName} 님은</Text>
            <Text style={styles.summaryDiagnosisLine}>
              <Text style={styles.summarySeverityBold}>{severityLabel} 척추측만증</Text>으로 예상 됩니다
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
            // 측정 시 찍은 이미지 
            viewMode={viewMode}
            measurementSet={measurementSet}
            backgroundImageSource={is3DView ? null : stageBackgroundSource}
            onRetry={reloadAnalysisData}
          />
          <View style={styles.viewModeToggleRow}>
            <Text style={[styles.viewModeLabel, !is3DView && styles.viewModeLabelActive]}>
              2D
            </Text>
            <Switch
              value={is3DView}
              onValueChange={(value) => setViewMode(value ? '3d' : '2d')}
              trackColor={{ false: '#C9D1D3', true: '#69B7BC' }}
              thumbColor="#FFFFFF"
            />
            <Text style={[styles.viewModeLabel, is3DView && styles.viewModeLabelActive]}>
              3D
            </Text>
          </View>
          <InfoCard level={infoCardLevel} />

          <SeverityCard metrics={pose.metrics} />

          <DominantCurveCard
            dominantCurve={dominantCurve}
            summaryName={summaryName}
            isWideLayout={isWideLayout}
            wideStageScale={wideStageScale}
          />

          <CurvePatternCard dominantCurve={dominantCurve} />

          <AiDoctorCard />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      <TopScrollGradient visible={topScrollGradient.visible} />
    </View>
  );
}
