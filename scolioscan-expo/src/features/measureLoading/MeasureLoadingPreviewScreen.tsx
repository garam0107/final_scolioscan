import { useFonts as useExpoFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoadingSearchIcon from '../../../assets/icons/home/loading_search.svg';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { Colors } from '@/src/constants/theme';

const pretendardFont = require('../../../assets/fonts/PretendardVariable.ttf');
// 피그마의 블러와 외곽 그림자 효과를 유지하기 위해 차트는 PNG로 표시한다.
const loadingChartImage4x = require('../../../assets/icons/home/loading_chart_4x.png');
const loadingMessages = [
  'AI 의사가 진단하는 중이에요',
  '척추 각도 정보를 확인하고 있어요',
  '최근 측정 데이터와 비교하고 있어요',
  '분석 결과를 정리하고 있어요',
];

// 돋보기 렌즈 중심을 기준으로 차트 주변 위치를 계산한다.
const SEARCH_VIEWBOX_WIDTH = 99;
const SEARCH_VIEWBOX_HEIGHT = 101;
const SEARCH_LENS_CENTER_X = 43.4896;
const SEARCH_LENS_CENTER_Y = 43.4896;
const SEARCH_ORBIT_INPUT_RANGE = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
const SEARCH_ROTATE_INPUT_RANGE = [0, 0.25, 0.5, 0.75, 1];

export default function MeasureLoadingPreviewScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const rotateProgress = useRef(new Animated.Value(0)).current;
  const spinnerProgress = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(18)).current;
  // 문구가 바뀔 때 새 문구만 아래에서 위로 나타나게 제어한다.
  const messageEnterProgress = useRef(new Animated.Value(1)).current;
  const [messageIndex, setMessageIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [pretendardLoaded, pretendardError] = useExpoFonts({ PretendardVariable: pretendardFont });
  const iconScale = Math.min(1, Math.max(0.86, width / 390));
  const chartSize = 131 * iconScale;
  const searchSize = 99 * iconScale;
  const orbitSize = 164 * iconScale;
  const orbitCenter = orbitSize / 2;
  const orbitRadius = 42 * iconScale;
  const searchLensCenterX = searchSize * (SEARCH_LENS_CENTER_X / SEARCH_VIEWBOX_WIDTH);
  const searchLensCenterY = searchSize * (SEARCH_LENS_CENTER_Y / SEARCH_VIEWBOX_HEIGHT);

  const searchTranslateX = rotateProgress.interpolate({
    inputRange: SEARCH_ORBIT_INPUT_RANGE,
    outputRange: [
      orbitRadius,
      0,
      -orbitRadius,
      -orbitRadius,
      -orbitRadius,
      0,
      orbitRadius,
      orbitRadius,
      orbitRadius,
    ],
  });
  const searchTranslateY = rotateProgress.interpolate({
    inputRange: SEARCH_ORBIT_INPUT_RANGE,
    outputRange: [
      orbitRadius,
      orbitRadius,
      orbitRadius,
      0,
      -orbitRadius,
      -orbitRadius,
      -orbitRadius,
      0,
      orbitRadius,
    ],
  });
  const searchRotate = rotateProgress.interpolate({
    inputRange: SEARCH_ROTATE_INPUT_RANGE,
    outputRange: ['0deg', '90deg', '135deg', '-25deg', '0deg'],
  });
  const spinnerRotate = spinnerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const messageTranslateY = messageEnterProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  const currentMessage = useMemo(() => loadingMessages[messageIndex], [messageIndex]);

  useEffect(() => {
    const orbitAnimation = Animated.loop(
      Animated.timing(rotateProgress, {
        toValue: 1,
        duration: 4800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    // 분석 완료 후에도 돋보기는 계속 움직인다.
    orbitAnimation.start();

    return () => {
      orbitAnimation.stop();
    };
  }, [rotateProgress]);

  useEffect(() => {
    if (isComplete) {
      return undefined;
    }

    const spinnerAnimation = Animated.loop(
      Animated.timing(spinnerProgress, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    spinnerAnimation.start();

    return () => {
      spinnerAnimation.stop();
    };
  }, [isComplete, spinnerProgress]);

  useEffect(() => {
    if (isComplete) {
      return undefined;
    }

    // 분석 중 문구만 일정 간격으로 바꾼다.
    const messageTimer = setInterval(() => {
      messageEnterProgress.setValue(0);
      setMessageIndex((value) => (value + 1) % loadingMessages.length);
      Animated.timing(messageEnterProgress, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 1500);

    return () => clearInterval(messageTimer);
  }, [isComplete, messageEnterProgress]);

  useEffect(() => {
    const completeTimer = setTimeout(() => {
      setIsComplete(true);
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 10000);

    return () => clearTimeout(completeTimer);
  }, [buttonOpacity, buttonTranslateY]);

  if (!pretendardLoaded && !pretendardError) {
    return <SafeAreaView style={styles.screen} />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        <View style={[styles.visualWrap, { width: orbitSize, height: orbitSize }]}>
          <Image
            source={loadingChartImage4x}
            style={{ width: chartSize, height: chartSize }}
            resizeMode="contain"
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.searchMover,
              {
                left: orbitCenter - searchLensCenterX,
                top: orbitCenter - searchLensCenterY,
                width: searchSize,
                height: searchSize,
                transform: [
                  { translateX: searchTranslateX },
                  { translateY: searchTranslateY },
                  { rotate: searchRotate },
                ],
              },
            ]}
          >
            <LoadingSearchIcon width={searchSize} height={searchSize} />
          </Animated.View>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title}>{isComplete ? '분석이 완료되었어요!' : '척추 정보를 분석 중이에요'}</Text>
          {isComplete ? null : (
            <View style={styles.loadingRow}>
              <Animated.View style={[styles.spinner, { transform: [{ rotate: spinnerRotate }] }]} />
              <Animated.Text
                style={[
                  styles.loadingText,
                  {
                    opacity: messageEnterProgress,
                    transform: [{ translateY: messageTranslateY }],
                  },
                ]}
              >
                {currentMessage}
              </Animated.Text>
            </View>
          )}
        </View>

        <View style={styles.tipBlock}>
          <View style={styles.tipBadge}>
            <Text style={styles.tipBadgeText}>척추관리 Tip</Text>
          </View>
          <Text style={styles.tipText}>
            1시간에 1분씩, 허리를 쭉 펴주는 스트레칭만으로도{'\n'}
            척추측만증을 예방할 수 있어요.
          </Text>
        </View>
      </View>

      <Animated.View
        pointerEvents={isComplete ? 'auto' : 'none'}
        style={[
          styles.buttonArea,
          {
            opacity: buttonOpacity,
            transform: [{ translateY: buttonTranslateY }],
          },
        ]}
      >
        <PrimaryButton
          title="분석 결과 보기"
          onPress={() => router.push('/analysis')}
          width={width - 32}
          height={56}
          backgroundColor={Colors.mint[500]}
          borderRadius={6}
          textStyle={styles.buttonText}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.gray[25],
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 92,
  },
  visualWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchMover: {
    position: 'absolute',
  },
  textBlock: {
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 36,
  },
  title: {
    fontFamily: 'PretendardVariable',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: Colors.gray[900],
    textAlign: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 34,
  },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D7E1F1',
    borderTopColor: '#7F8EA8',
  },
  loadingText: {
    fontFamily: 'PretendardVariable',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.gray[400],
  },
  tipBlock: {
    position: 'absolute',
    bottom: 118,
    alignItems: 'center',
    gap: 14,
  },
  tipBadge: {
    height: 22,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: Colors.mint[400],
  },
  tipBadgeText: {
    fontFamily: 'PretendardVariable',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '400',
    color: Colors.primary.white,
  },
  tipText: {
    fontFamily: 'PretendardVariable',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '400',
    color: Colors.gray[300],
    textAlign: 'center',
  },
  buttonArea: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 60,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
  },
});
