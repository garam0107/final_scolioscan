import { Animated, Pressable, Text, View } from 'react-native';

import styles from '../analysis.styles';
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
  onRetry,
}: AnalysisStageProps) {
  return (
    <View style={[styles.stage, { height: stageHeight }]}>
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
