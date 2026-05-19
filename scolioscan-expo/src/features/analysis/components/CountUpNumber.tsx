import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import styles from '../styles/analysisStage.styles';
import { formatDegree } from '../utils/analysisFormat';

const SLOT_DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const SLOT_REPEAT_COUNT = 3;
// 숫자 이동 거리와 digitFrame, digitCell 높이를 맞춰 세로 롤링을 안정적으로 유지합니다.
const SLOT_ITEM_HEIGHT = 38;
const SLOT_DIGIT_ITEMS = Array.from(
  { length: SLOT_REPEAT_COUNT + 1 },
  () => SLOT_DIGITS,
).flat();

type SlotDigitProps = {
  digit: number;
  active: boolean;
  animationKey: number;
  order: number;
};

function SlotDigit({ digit, active, animationKey, order }: SlotDigitProps) {
  const step = useRef(new Animated.Value(0)).current;
  const maxStep = SLOT_REPEAT_COUNT * SLOT_DIGITS.length + 9;
  const targetStep = SLOT_REPEAT_COUNT * SLOT_DIGITS.length + digit;

  useEffect(() => {
    step.stopAnimation();

    if (!active) {
      step.setValue(targetStep);
      return;
    }

    // 숫자 휠을 0에서 여러 바퀴 굴린 뒤 목표 숫자에서 멈추게 해 실제 롤링처럼 보이게 합니다.
    step.setValue(0);
    const animation = Animated.timing(step, {
      toValue: targetStep,
      duration: 980 + order * 120,
      delay: order * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [active, animationKey, order, step, targetStep]);

  const translateY = step.interpolate({
    inputRange: [0, maxStep],
    outputRange: [0, -maxStep * SLOT_ITEM_HEIGHT],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.digitFrame} pointerEvents="none">
      <Animated.View style={[styles.digitWheel, { transform: [{ translateY }] }]}>
        {SLOT_DIGIT_ITEMS.map((item, index) => (
          <Text key={`${index}-${item}`} style={styles.digitCell}>
            {item}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

type CountUpNumberProps = {
  value: number;
  active: boolean;
  animationKey: number;
};

export default function CountUpNumber({
  value,
  active,
  animationKey,
}: CountUpNumberProps) {
  // 분석 값은 정수 각도로 표시하고, 자리별로 나눠 각 숫자에 같은 롤링 방식을 적용합니다.
  const target = Math.max(0, Math.round(Math.abs(value)));
  const digits = String(target).split('').map((digit) => Number(digit));

  return (
    <View style={styles.metricValueSlot} accessibilityLabel={formatDegree(target)}>
      {digits.map((digit, index) => (
        <SlotDigit
          key={`${digits.length}-${index}`}
          digit={digit}
          active={active}
          animationKey={animationKey}
          order={index}
        />
      ))}
      <Text style={styles.degree}>{'\u00B0'}</Text>
    </View>
  );
}
