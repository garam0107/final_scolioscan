import { Animated, ImageBackground, Pressable, Text, View, type ImageURISource } from 'react-native';
import Spine3DPreview from './Spine3DPreview';
import styles from '../styles/analysisStage.styles';
import type { AnalysisPose } from '../analysisPose';
import MetricBlock from './MetricBlock';
import SpineRig from './SpineRig';

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
  error: string | null;
  angleAnimationKey: number;
  progress: Animated.Value;
  // 측정 때 사용한 이미지 
  backgroundImageSource: ImageURISource | null;
  onRetry: () => void;
};

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
  // 측정 때 사용한 이미지 
  backgroundImageSource,
  onRetry,
}: AnalysisStageProps) {

  const is3DView = viewMode === '3d';
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
      {!is3DView ? (
        <View style={styles.spineLayer}>
          <SpineRig
            progress={progress}
            slices={pose.vertebrae}
            markers={pose.arcs}
            stageWidth={stageWidth}
            boneSize={stageBoneSize}
            spacing={stageBoneSpacing}
          />
        </View>
      ) : null}
        {is3DView ? (
      <View style={styles.stage3DModelSlot}>
        <Spine3DPreview />
      </View>
    ) : null}
        <View style={styles.textLayer}>
        {!is3DView ? (
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
        ) : null}

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
