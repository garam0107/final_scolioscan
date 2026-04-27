import { useRouter } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useMemo } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { useScoliometer } from '@/src/features/scoliometer/hooks/useScoliometer';
import styles from '@/src/features/scoliometer/scoliometer.styles';

const MINT = '#7AD7D4';
const YELLOW = '#FAD342';
const RED = '#F97B7B';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function mixColor(from: string, to: string, amount: number) {
  const ratio = clamp(amount, 0, 1);
  const fromNumber = parseInt(from.replace('#', ''), 16);
  const toNumber = parseInt(to.replace('#', ''), 16);
  const fromRed = (fromNumber >> 16) & 255;
  const fromGreen = (fromNumber >> 8) & 255;
  const fromBlue = fromNumber & 255;
  const toRed = (toNumber >> 16) & 255;
  const toGreen = (toNumber >> 8) & 255;
  const toBlue = toNumber & 255;
  const red = Math.round(fromRed + (toRed - fromRed) * ratio);
  const green = Math.round(fromGreen + (toGreen - fromGreen) * ratio);
  const blue = Math.round(fromBlue + (toBlue - fromBlue) * ratio);

  return `rgb(${red}, ${green}, ${blue})`;
}

function getBackgroundColor(angle: number) {
  const absAngle = Math.abs(angle);

  if (absAngle <= 20) {
    return MINT;
  }

  if (absAngle <= 39) {
    return mixColor(MINT, YELLOW, (absAngle - 21) / (39 - 21));
  }

  if (absAngle <= 60) {
    return YELLOW;
  }

  if (absAngle <= 79) {
    return mixColor(YELLOW, RED, (absAngle - 61) / (79 - 61));
  }

  return RED;
}

function formatAngle(angle: number, isFlat: boolean) {
  const value = isFlat ? Math.abs(angle) : angle;
  const rounded = Math.round(value * 10) / 10;

  if (Math.abs(rounded) < 0.05) {
    return '0°';
  }

  if (Number.isInteger(rounded)) {
    return `${rounded.toFixed(0)}°`;
  }

  return `${rounded.toFixed(1)}°`;
}

function getCircleOverlapPath(
  firstCx: number,
  firstCy: number,
  secondCx: number,
  secondCy: number,
  radius: number,
) {
  const dx = secondCx - firstCx;
  const dy = secondCy - firstCy;
  const distance = Math.sqrt(dx ** 2 + dy ** 2);

  if (distance <= 0.5) {
    return {
      isFullOverlap: true,
      path: '',
    };
  }

  if (distance >= radius * 2) {
    return null;
  }

  const halfDistance = distance / 2;
  const height = Math.sqrt(radius ** 2 - halfDistance ** 2);
  const midX = firstCx + dx * 0.5;
  const midY = firstCy + dy * 0.5;
  const offsetX = (-dy / distance) * height;
  const offsetY = (dx / distance) * height;
  const firstPointX = midX + offsetX;
  const firstPointY = midY + offsetY;
  const secondPointX = midX - offsetX;
  const secondPointY = midY - offsetY;

  return {
    isFullOverlap: false,
    path: [
      `M ${firstPointX} ${firstPointY}`,
      `A ${radius} ${radius} 0 0 1 ${secondPointX} ${secondPointY}`,
      `A ${radius} ${radius} 0 0 1 ${firstPointX} ${firstPointY}`,
      'Z',
    ].join(' '),
  };
}

export default function ScoliometerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const {
    angle,
    mode,
    surfaceAngle,
    bubbleX,
    bubbleY,
    bubbleScale,
    isSupported,
    calibrate,
  } = useScoliometer();

  const isFlat = mode === 'flat';
  const backgroundColor = useMemo(() => getBackgroundColor(angle), [angle]);
  const angleLabel = useMemo(() => formatAngle(angle, isFlat), [angle, isFlat]);
  const horizonY = height * 0.5;
  
  const surfaceWidth = width * 2.4;
  const surfaceHeight = height * 1.55;
  // 평면 모드 가운데 원 사이즈
  const flatSize = Math.min(width, height) * 0.34;
  // 각도에 따라 원이 벌어지는 거리
  const flatTravel = Math.min(width, height) * 0.5;
  const flatSvgSize = Math.min(width, height) * 0.86;
  const flatRadius = flatSize / 2;
  const flatSvgCenter = flatSvgSize / 2;
  const flatOffsetX = (bubbleX / 100) * flatTravel;
  const flatOffsetY = (bubbleY / 100) * flatTravel;
  // 원 2개가 반대 방향으로 벌어지는 비율
  const flatFirstCx = flatSvgCenter - flatOffsetX * 0.6;
  const flatFirstCy = flatSvgCenter - flatOffsetY * 0.6;
  const flatSecondCx = flatSvgCenter + flatOffsetX * 0.6;
  const flatSecondCy = flatSvgCenter + flatOffsetY * 0.6;
  const overlap = useMemo(
    () => getCircleOverlapPath(flatFirstCx, flatFirstCy, flatSecondCx, flatSecondCy, flatRadius),
    [flatFirstCx, flatFirstCy, flatRadius, flatSecondCx, flatSecondCy],
  );
  const angleTop = isFlat ? height * 0.43 : horizonY - 50;
  
  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

    if (Platform.OS === 'android') {
      void NavigationBar.setBehaviorAsync('overlay-swipe');
      void NavigationBar.setVisibilityAsync('hidden');
    }

    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

      if (Platform.OS === 'android') {
        void NavigationBar.setVisibilityAsync('visible');
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'right', 'bottom', 'left']}>
        <View style={styles.unsupported}>
          <Text style={styles.unsupportedText}>이 기기에서는 움직임 센서를 사용할 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor }]} edges={[]}>
      <View style={styles.content}>
        <View style={[styles.topBar, { paddingTop: insets.top + 2 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>
        </View>

        {isFlat ? (
          <>
            <Svg
              style={[
                styles.flatSvg,
                {
                  width: flatSvgSize,
                  height: flatSvgSize,
                  left: width / 2 - flatSvgSize / 2,
                  top: height / 2 - flatSvgSize / 2,
                },
              ]}
              width={flatSvgSize}
              height={flatSvgSize}
            >
              <Circle
                cx={flatFirstCx}
                cy={flatFirstCy}
                r={flatRadius}
                fill="#FFFFFF"
                fillOpacity={0.45}
                stroke="#FFFFFF"
                strokeOpacity={0.85}
                strokeWidth={1.5}
              />
              <Circle
                cx={flatSecondCx}
                cy={flatSecondCy}
                r={flatRadius * bubbleScale}
                fill="#FFFFFF"
                fillOpacity={0.45}
                stroke="#FFFFFF"
                strokeOpacity={0.85}
                strokeWidth={1.5}
              />
              {overlap?.isFullOverlap ? (
                <Circle
                  cx={flatSvgCenter}
                  cy={flatSvgCenter}
                  r={flatRadius}
                  fill="#FFFFFF"
                  fillOpacity={1}
                />
              ) : null}
              {overlap && !overlap.isFullOverlap ? (
                <Path d={overlap.path} fill="#FFFFFF" fillOpacity={1} />
              ) : null}
            </Svg>
            <View style={[styles.angleWrap, { top: angleTop }]}>
              <Text style={[styles.angleText, styles.angleTextDark]}>{angleLabel}</Text>
            </View>
          </>
        ) : (
          <>
            <View
              style={[
                styles.surface,
                {
                  width: surfaceWidth,
                  height: surfaceHeight,
                  left: (width - surfaceWidth) / 2,
                  top: horizonY,
                  transform: [
                    { translateY: -surfaceHeight / 2 },
                    { rotateZ: `${surfaceAngle}deg` },
                    { translateY: surfaceHeight / 2 },
                  ],
                },
              ]}
            />
            <View style={styles.bottomBubble} />
          </>
        )}

       {!isFlat ? (
  <View
    style={[
      styles.angleWrap,
      {
        top: angleTop,
        transform: [{ rotateZ: `${surfaceAngle}deg` }],
      },
    ]}
  >
    <Text style={styles.angleText}>{angleLabel}</Text>
  </View>
) : null}


        <Pressable
          onPress={calibrate}
          style={[styles.calibrateButton, { bottom: 18 }]}
        >
          <Text style={styles.calibrateButtonText}>0도 보정</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
