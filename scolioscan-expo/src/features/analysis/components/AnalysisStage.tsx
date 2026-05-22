import { Animated, ImageBackground, Pressable, Text, View, type ImageURISource } from 'react-native';

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
  // 측정 때 사용한 이미지 
  backgroundImageSource,
  onRetry,
}: AnalysisStageProps) {
  return (
    <View style={[styles.stage, { height: stageHeight }]}>
      {/* 측정 때 사용한 이미지  */}
      {backgroundImageSource ? (
        <ImageBackground
          source={backgroundImageSource}
          style={styles.stageBackgroundPhoto}
          resizeMode="cover"
        >
          {/* 촬영 사진 위에서도 척추와 각도 텍스트가 잘 보이도록 어두운 막을 한 겹 올립니다. */}
          <View style={styles.stageBackgroundOverlay} />
        </ImageBackground>
      ) : null}

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

      <View style={styles.textLayer}>
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
          <Text style={styles.emptyText}>최근 측정 결과가 없어요. 먼저 측정을 진행해 주세요.</Text>
        ) : null}

        {error ? (
          <>
            <Text style={styles.errorText}>{error}</Text>
            {/* 재시도 버튼은 화면 상태만 갱신하므로 부모 화면의 reloadKey 증가 함수를 그대로 호출합니다. */}
            <Pressable style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}
