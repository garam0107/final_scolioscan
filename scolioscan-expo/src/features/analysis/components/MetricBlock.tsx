import { Animated, Text, View } from 'react-native';

import styles from '../styles/analysisStage.styles';
import CountUpNumber from './CountUpNumber';

type MetricBlockProps = {
  metricKey: 'upper' | 'main' | 'lumbar';
  label: string;
  value: number;
  side: 'left' | 'right';
  top: number;
  xOffset: number;
  xOffsetScale: number;
  sideInset: number;
  active: boolean;
  animationKey: number;
  progress: Animated.Value;
};

export default function MetricBlock({
  metricKey,
  label,
  value,
  side,
  top,
  xOffset,
  xOffsetScale,
  sideInset,
  active,
  animationKey,
  progress,
}: MetricBlockProps) {
  // 척추가 휘는 진행도와 같은 progress 값으로 각도 라벨도 목표 위치까지 같이 이동합니다.
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, xOffset * xOffsetScale],
  });

  return (
    <Animated.View
      style={[
        styles.metric,
        {
          top,
          left: side === 'left' ? sideInset : undefined,
          right: side === 'right' ? sideInset : undefined,
          transform: [{ translateX }],
        },
      ]}
    >
      <View style={side === 'left' ? styles.metricLeft : styles.metricRight}>
        <Text style={styles.metricLabel}>{label}</Text>
        <View
          style={[
            styles.valueRow,
            metricKey === 'main' && { transform: [{ translateX: 8 * xOffsetScale }] },
            metricKey === 'lumbar' && { transform: [{ translateX: 20 * xOffsetScale }] },
          ]}
        >
          <CountUpNumber value={value} active={active} animationKey={animationKey} />
        </View>
      </View>
    </Animated.View>
  );
}
