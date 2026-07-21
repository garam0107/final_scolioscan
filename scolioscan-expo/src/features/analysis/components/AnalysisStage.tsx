import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  Pressable,
  Text,
  View,
  type ImageURISource,
} from 'react-native';
import Spine3DPreview from './Spine3DPreview';
import styles from '../styles/analysisStage.styles';
import type { AnalysisPose } from '../analysisPose';
import type { MeasurementSetResponse } from '@/src/types/measurementSet';
import MetricBlock from './MetricBlock';
import SpineRig from './SpineRig';
import { Colors } from '@/src/constants/theme';

type Spine3DMetric = {
  key: 'upper' | 'main' | 'lumbar';
  label: string;
  top: `${number}%`;
  curvatureValue?: number | null;
  rotationValue?: number | null;
};

type AnalysisStageProps = {
  pose: AnalysisPose;
  stageHeight: number;
  stageWidth: number;
  stageBoneSize: number;
  stageBoneSpacing: number;
  wideStageScale: number;
  metricSideInset: number;
  hasAnalysis: boolean;
  loading: boolean;
  viewMode: '2d' | '3d';
  measurementSet: MeasurementSetResponse | null;
  screenFocused: boolean;
  error: string | null;
  angleAnimationKey: number;
  progress: Animated.Value;
  // 측정 때 사용한 이미지 
  backgroundImageSource: ImageURISource | null;
  onRetry: () => void;
};

function formatDegree(value?: number | null, decimal = false) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';

  const absoluteValue = Math.abs(value);
  const rounded = decimal
    ? Math.round(absoluteValue * 10) / 10
    : Math.round(absoluteValue);

  if (decimal && !Number.isInteger(rounded)) {
    return `${rounded.toFixed(1)}°`;
  }

  return `${rounded.toFixed(0)}°`;
}

function Spine3DMetricOverlay({ metric }: { metric: Spine3DMetric }) {
  const hasRotationValue =
    typeof metric.rotationValue === 'number' && !Number.isNaN(metric.rotationValue);

  return (
    <View style={[styles.stage3DMetricGroup, { top: metric.top }]} pointerEvents="none">
      <View style={styles.stage3DMetricBadge}>
        <Text style={styles.stage3DMetricBadgeText}>{metric.label}</Text>
      </View>

      <View style={styles.stage3DMetricRow}>
        <View style={styles.stage3DMetricValues}>
          <View style={styles.stage3DMetricCurveColumn}>
            <Text style={styles.stage3DMetricLabel}>만곡도</Text>
            <Text style={styles.stage3DMetricValue}>{formatDegree(metric.curvatureValue)}</Text>
          </View>

          <View style={styles.stage3DMetricRotationColumn}>
            <Text style={styles.stage3DMetricLabel}>비틀림</Text>
            {/* rotation 미측정 시 0도 값을 보여 주되, 피그마와 같이 값만 블러 처리한다. */}
            <Text
              style={[
                styles.stage3DMetricValue,
                !hasRotationValue && styles.stage3DMetricValueBlurred,
              ]}
            >
              {formatDegree(hasRotationValue ? metric.rotationValue : 0, true)}
            </Text>
          </View>
        </View>

        <View style={styles.stage3DMetricGuideLine} />
      </View>
    </View>
  );
}

export default function AnalysisStage({
  pose,
  stageHeight,
  stageWidth,
  stageBoneSize,
  stageBoneSpacing,
  wideStageScale,
  metricSideInset,
  hasAnalysis,
  loading,
  error,
  angleAnimationKey,
  progress,
  viewMode,
  measurementSet,
  screenFocused,
  // 측정 때 사용한 이미지 
  backgroundImageSource,
  onRetry,
}: AnalysisStageProps) {

  const is3DView = viewMode === '3d';
  const is3DActive = is3DView && screenFocused;
  const [is3DModelReady, setIs3DModelReady] = useState(false);
  const show3DPlaceholder = is3DView && !is3DModelReady;
  const curvature = measurementSet?.curvature;
  const rotation = measurementSet?.rotation;
  const stage3DMetrics: Spine3DMetric[] = [
    {
      key: 'upper',
      label: '상부 흉추',
      top: '6%',
      curvatureValue: curvature?.secondary_thoracic_cobb,
      rotationValue: rotation?.upper_thoracic_atr,
    },
    {
      key: 'main',
      label: '주 흉추',
      top: '33%',
      curvatureValue: curvature?.main_thoracic_cobb,
      rotationValue: rotation?.thoracic_atr,
    },
    {
      key: 'lumbar',
      label: '요추',
      top: '60%',
      curvatureValue: curvature?.lumbar_cobb,
      rotationValue: rotation?.lumbar_atr,
    },
  ];

  useEffect(() => {
    if (is3DView) {
      setIs3DModelReady(false);
    }
  }, [is3DView]);

  const handle3DRenderStateChange = useCallback((ready: boolean) => {
    setIs3DModelReady(ready);
  }, []);

  return (
   <View style={[styles.stage, is3DView && styles.stage3D, { height: stageHeight }]}>
      {/* 측정 때 사용한 이미지  */}
        {!is3DView && backgroundImageSource ? (
          <ImageBackground
            source={backgroundImageSource}
            style={styles.stageBackgroundPhoto}
            resizeMode="cover"
          >
            <View style={styles.stageBackgroundOverlay} />
          </ImageBackground>
        ) : null}
        <View
          pointerEvents={is3DView ? 'none' : 'auto'}
          style={[styles.spineLayer, is3DView && styles.stage2DHidden]}
        >
          <SpineRig
            progress={progress}
            slices={pose.vertebrae}
            markers={pose.arcs}
            stageWidth={stageWidth}
            boneSize={stageBoneSize}
            spacing={stageBoneSpacing}
          />
        </View>
      <View
        style={[
          styles.stage3DModelSlot,
          !is3DView ? styles.stage3DModelSlotHidden : null,
        ]}
        pointerEvents={is3DView ? 'auto' : 'none'}
      >
        <Spine3DPreview
          measurementSet={measurementSet}
          active={is3DActive}
          onRenderStateChange={handle3DRenderStateChange}
        />
        {show3DPlaceholder ? (
          <View style={styles.stage3DPlaceholder} pointerEvents="none">
            <ActivityIndicator color={Colors.primary.white} />
            <Text style={styles.stage3DPlaceholderText}>3D 모델을 불러오는 중입니다...</Text>
          </View>
        ) : null}
      </View>
        {is3DView ? (
      <View style={styles.stage3DOverlay} pointerEvents="none">
        {stage3DMetrics.map((metric) => (
          <Spine3DMetricOverlay key={metric.key} metric={metric} />
        ))}
      </View>
    ) : null}
      <View
        pointerEvents={is3DView ? 'none' : 'auto'}
        style={[styles.textLayer, is3DView && styles.stage2DHidden]}
      >
          <>
            {pose.metrics.map((metric) => (
              <MetricBlock
                key={metric.key}
                metricKey={metric.key}
                label={metric.label}
                value={metric.value}
                side={metric.side}
                top={metric.topRatio * stageHeight}
                xOffset={metric.xOffset}
                xOffsetScale={wideStageScale}
                sideInset={metricSideInset}
                active={hasAnalysis}
                animationKey={angleAnimationKey}
                progress={progress}
              />
            ))}

            {!hasAnalysis && !loading ? (
              <Text style={styles.emptyText}>
                최근 측정 결과가 없어요. 먼저 측정을 진행해 주세요.
              </Text>
            ) : null}
          </>
      

        {error ? (
          <>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}
