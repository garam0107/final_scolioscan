import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { curvatureAPI } from '@/src/api/curvature';
import { measurementSetAPI } from '@/src/api/measurementSet';
import { rotationAPI } from '@/src/api/rotation';
import MeasurementRequiredCard from '@/src/components/MeasurementRequiredCard';
import TopScrollGradient, { useTopScrollGradient } from '@/src/components/TopScrollGradient';
import { useAuth } from '@/src/contexts/AuthContext';
import { useMeasurementRefreshStore } from '@/src/store/measurementRefreshStore';
import type { AnalysisResponse } from '@/src/types/analysis';
import type { InfoCardLevel } from './analysisCopy';
import styles from './analysis.styles';
import { createAnalysisPose } from './analysisPose';
import AiDoctorCard from './components/AiDoctorCard';
import AnalysisStage from './components/AnalysisStage';
import CurvePatternCard from './components/CurvePatternCard';
import DominantCurveCard from './components/DominantCurveCard';
import InfoCard from './components/InfoCard';
import SeverityCard from './components/SeverityCard';
import {
  toAnalysisFromCurvature,
  toAnalysisFromMeasurementSet,
  toAnalysisFromRotation,
} from './utils/analysisMappers';
import {
  classifyDominantCurve,
  getDominantCurveInfo,
} from './severity';
import { useAnalysisAnimation } from './hooks/useAnalysisAnimation';

const SPINE_BONE_SIZE = 72;
const SPINE_BONE_SPACING = 24;
const WIDE_LAYOUT_MIN_WIDTH = 600;
const BASE_STAGE_WIDTH = 420;
const BASE_STAGE_HEIGHT = 380;
const STAGE_HORIZONTAL_PADDING = 20;

type AnalysisScreenProps = {
  analysisId?: string;
  sourceType?: string;
};

// 2D, 3D 토글
type ViewMode = '2d' | '3d';

function getWideStageScale(width: number, height: number) {
  if (width < WIDE_LAYOUT_MIN_WIDTH) return 1;

  const availableStageWidth = Math.max(1, width - 32 - STAGE_HORIZONTAL_PADDING);
  const widthScale = availableStageWidth / BASE_STAGE_WIDTH;
  const heightScale = Math.max(1, (height - 180) / BASE_STAGE_HEIGHT);

  // 태블릿에서는 화면을 꽉 쓰되 첫 화면에서 과하게 커지지 않도록 가로/세로 중 작은 배율을 사용한다.
  return Math.max(1, Math.min(widthScale, heightScale));
}

export default function AnalysisScreen({ analysisId, sourceType }: AnalysisScreenProps) {
  const { width, height } = useWindowDimensions();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const {
    progress,
    angleAnimationKey,
    startAnalysisAnimation,
    resetAnalysisAnimation,
  } = useAnalysisAnimation(Boolean(analysis));
  const topScrollGradient = useTopScrollGradient();
  const measurementVersion = useMeasurementRefreshStore((state) => state.version);

  const pose = useMemo(() => createAnalysisPose(analysis), [analysis]);
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
  const shouldShowMeasurementRequired = !loading && !analysis && !error;

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

  useEffect(() => {
    let mounted = true;

    async function loadLatest() {
      // 상세 진입이면 해당 id를, 탭 진입이면 최신 2D 기준 측정 세트를 불러와 분석 모델로 변환한다.
      setLoading(true);
      setError(null);

      try {
        let targetAnalysis: AnalysisResponse | null = null;

        if (analysisId) {
          // 상세 화면은 전달받은 id와 sourceType 기준으로 정확한 분석 한 건을 불러온다.
          if (sourceType === 'rotation') {
            const response = await rotationAPI.getAnalysis(analysisId);
            targetAnalysis = toAnalysisFromRotation(response.data);
          } else {
            const response = await curvatureAPI.getAnalysis(analysisId);
            targetAnalysis = toAnalysisFromCurvature(response.data);
          }
        } else {
          // 탭 화면은 최신 2D 결과를 기준으로 연결된 측정 세트를 찾아 보여준다.
          const response = await curvatureAPI.getAnalyses({ limit: 1 });
          const latestCurvature = response.data[0] ?? null;

          if (latestCurvature) {
            const measurementSetResponse = await measurementSetAPI.getByCurvature(latestCurvature.id);
            targetAnalysis = toAnalysisFromMeasurementSet(measurementSetResponse.data);
          }
        }

        if (!mounted) return;

        setAnalysis(targetAnalysis ?? null);
        startAnalysisAnimation(targetAnalysis ? 1600 : 0);
      } catch {
        if (!mounted) return;
        setAnalysis(null);
        setError('최신 분석 결과를 불러오지 못했어요.');
        resetAnalysisAnimation();
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadLatest();

    return () => {
      mounted = false;
    };
  }, [analysisId, measurementVersion, reloadKey, resetAnalysisAnimation, sourceType, startAnalysisAnimation]);
  // 현재 선택된 분석 탭을 다시 누르면 보던 위치와 상관없이 맨 위로 이동한다.
  useScrollToTop(scrollRef);
  if (loading) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
          <StatusBar style="dark" backgroundColor="#F4F6F7" translucent={false} />
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#69B7BC" />
            <Text style={styles.loadingText}>분석 결과를 불러오는 중입니다...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right', ]} style={{ flex: 1 }}>
        <StatusBar style="dark" backgroundColor="#F4F6F7" translucent={false} />

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator
          onScroll={topScrollGradient.onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.content,
            shouldShowMeasurementRequired ? styles.measurementRequiredContent : null,
            { paddingTop: 8, paddingBottom: 16  },
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
            onRetry={() => setReloadKey((value) => value + 1)}
          />

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
