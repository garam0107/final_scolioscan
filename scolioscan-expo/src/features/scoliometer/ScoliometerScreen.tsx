import { useLocalSearchParams, useRouter } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { rotationAPI } from '@/src/api/rotation';
import { useScoliometer } from '@/src/features/scoliometer/hooks/useScoliometer';
import { useMeasurementRefreshStore } from '@/src/store/measurementRefreshStore';
import {
  SCOLIOMETER_REQUIRED_SAMPLE_COUNT,
  type ScoliometerSample,
  useScoliometerSessionStore,
} from '@/src/store/scoliometerSessionStore';
import type { RotationCreatePayload } from '@/src/types/rotation';
import styles from '@/src/features/scoliometer/scoliometer.styles';

const MINT = '#7AD7D4';
const YELLOW = '#FAD342';
const RED = '#F97B7B';
const LANDSCAPE_ANGLE_ANCHOR_HEIGHT = 58;
const LANDSCAPE_GUIDE_ANCHOR_HEIGHT = 28;

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
  // 측정 각도 구간에 따라 화면 배경색을 단계적으로 바꿔 위험도를 직관적으로 보여준다.
  const absAngle = Math.abs(angle);

  // 각도 구간별 배경색이다. 구간 숫자와 색상값을 바꾸면 위험도 색상 느낌을 조정할 수 있다.
  if (absAngle <= 10) {
    return MINT;
  }

  if (absAngle <= 20) {
    return mixColor(MINT, YELLOW, (absAngle - 11) / (20 - 11));
  }

  if (absAngle <= 30) {
    return YELLOW;
  }

  if (absAngle <= 40) {
    return mixColor(YELLOW, RED, (absAngle - 31) / (40 - 31));
  }

  return RED;
}

function formatAngle(angle: number) {
  const value = Math.abs(angle);
  const rounded = Math.round(value * 10) / 10;

  if (Math.abs(rounded) < 0.05) {
    return '0°';
  }

  if (Number.isInteger(rounded)) {
    return `${rounded.toFixed(0)}°`;
  }

  return `${rounded.toFixed(1)}°`;
}

function buildRotationPayload(
  samples: ScoliometerSample[],
  curvatureMeasurementId?: number | null,
): RotationCreatePayload {
  // 측정 순서는 화면 가이드 순서와 API 필드 순서가 같아야 하므로 배열 인덱스로 매핑한다.
  const values = samples.map((sample) => sample.angle);

  return {
    upper_thoracic_atr: values[0] ?? 0,
    lower_thoracic_atr: values[1] ?? 0,
    thoracolumbar_atr: values[2] ?? 0,
    upper_lumbar_atr: values[3] ?? 0,
    lower_lumbar_atr: values[4] ?? 0,
    curvature_measurement_id: curvatureMeasurementId ?? null,
  };
}

function parsePositiveId(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = rawValue ? Number(rawValue) : NaN;

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function getCircleOverlapPath(
  firstCx: number,
  firstCy: number,
  secondCx: number,
  secondCy: number,
  radius: number,
) {
  // 평면 모드의 두 원이 겹치는 영역만 흰색으로 채우기 위한 SVG path를 만든다.
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

  // 두 원의 교차점 2개를 계산해서 겹친 렌즈 모양만 100% 흰색으로 그린다.
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
  const { curvatureMeasurementId: curvatureMeasurementIdParam } = useLocalSearchParams<{
    curvatureMeasurementId?: string | string[];
  }>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [submitting, setSubmitting] = useState(false);
  const samples = useScoliometerSessionStore((state) => state.samples);
  const curvatureMeasurementId = useScoliometerSessionStore((state) => state.curvatureMeasurementId);
  const addSample = useScoliometerSessionStore((state) => state.addSample);
  const markMeasurementChanged = useMeasurementRefreshStore((state) => state.markMeasurementChanged);
  const setCurvatureMeasurementId = useScoliometerSessionStore((state) => state.setCurvatureMeasurementId);
  const resetSession = useScoliometerSessionStore((state) => state.resetSession);
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
  const angleLabel = useMemo(() => formatAngle(angle), [angle]);
  const measuredCount = samples.length;
  const measureButtonLabel = submitting
    ? '저장 중'
    : measuredCount >= SCOLIOMETER_REQUIRED_SAMPLE_COUNT
      ? '저장 재시도'
      : `측정 ${measuredCount}/${SCOLIOMETER_REQUIRED_SAMPLE_COUNT}`;
  // 가로 모드에서 색상 영역과 흰색 영역이 만나는 기준선이다.
  const horizonY = height * 0.5;
  
  // 가로 모드 흰색 면 크기다. 가장자리에 색 띠가 남으면 이 값을 더 키우면 된다.
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
  const activeCurvatureMeasurementId = curvatureMeasurementId ?? parsePositiveId(curvatureMeasurementIdParam);
  // 원 2개가 반대 방향으로 벌어지는 비율
  const flatFirstCx = flatSvgCenter - flatOffsetY * 0.6;
  const flatFirstCy = flatSvgCenter - flatOffsetX * 0.6;
  const flatSecondCx = flatSvgCenter + flatOffsetY * 0.6;
  const flatSecondCy = flatSvgCenter + flatOffsetX * 0.6;
  const overlap = useMemo(
    () => getCircleOverlapPath(flatFirstCx, flatFirstCy, flatSecondCx, flatSecondCy, flatRadius),
    [flatFirstCx, flatFirstCy, flatRadius, flatSecondCx, flatSecondCy],
  );
  // 가로 모드 숫자 위치다. 흰색 경계에 묻히면 0.24 값을 키워 조금 더 위로 올린다.
  const landscapeAngleTop = horizonY - Math.min(height * 0.24, 96);
  const angleTop = isFlat ? height * 0.43 : landscapeAngleTop;
  // 가로 모드 문구와 숫자는 고정된 박스 중심에서 회전해야 좌우 기울임이 같은 위치처럼 보인다.
  const landscapeAngleAnchorWidth = Math.min(width * 0.62, 260);
  const landscapeGuideAnchorWidth = Math.min(width * 0.74, 360);

  // 측정 횟수에 따라 변하도록 text 변경 필요
  const guideText = '측정을 진행해주세요';
  
  const displayGuideText = measuredCount > 0
    ? `${measuredCount}회 측정했어요. 이어서 측정해주세요`
    : guideText;

  useEffect(() => {
    const nextCurvatureMeasurementId = parsePositiveId(curvatureMeasurementIdParam);

    if (nextCurvatureMeasurementId) {
      setCurvatureMeasurementId(nextCurvatureMeasurementId);
    }
  }, [curvatureMeasurementIdParam, setCurvatureMeasurementId]);

  const handleStopConfirmed = useCallback(() => {
    // 측정 중단 시에는 2D 측정과 이어지는 임시 세션도 함께 비운다.
    resetSession();
    router.replace('/home');
  }, [resetSession, router]);

  const showStopConfirm = useCallback(() => {
    Alert.alert(
      '측정을 중단할까요?',
      '진행 중인 척추측만계 측정값이 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '확인', style: 'destructive', onPress: handleStopConfirmed },
      ],
      { cancelable: true },
    );
  }, [handleStopConfirmed]);

  const handleMeasurePress = useCallback(async () => {
    // 필요한 샘플 수가 모이면 회전 측정값을 저장하고, 부족하면 현재 각도만 세션에 누적한다.
    if (submitting) return;

    const currentAngle = angle;
    const nextSamples =
      samples.length >= SCOLIOMETER_REQUIRED_SAMPLE_COUNT
        ? samples
        : [
            ...samples,
            {
              angle: currentAngle,
              measuredAt: Date.now(),
            },
          ];

    if (samples.length < SCOLIOMETER_REQUIRED_SAMPLE_COUNT) {
      addSample(currentAngle);
    }

    if (nextSamples.length < SCOLIOMETER_REQUIRED_SAMPLE_COUNT) {
      return;
    }

    setSubmitting(true);

    try {
      await rotationAPI.createAnalysis(buildRotationPayload(nextSamples, activeCurvatureMeasurementId));
      markMeasurementChanged();
      resetSession();
      router.replace('/measure-loading-preview');
    } catch {
      Alert.alert('저장 실패', '척추측만계 측정을 저장하지 못했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }, [activeCurvatureMeasurementId, addSample, angle, markMeasurementChanged, resetSession, router, samples, submitting]);

  useEffect(() => {
    // 측만계는 가로 화면에서 측정하므로 진입 시 방향과 안드로이드 내비게이션 바를 조정한다.
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

  useEffect(() => {
    // 안드로이드 뒤로가기는 측정 중단 확인창으로 연결해 실수로 세션이 사라지는 것을 막는다.
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      showStopConfirm();
      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [showStopConfirm]);

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
          <Pressable onPress={showStopConfirm} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>
        </View>

        {isFlat ? (
          <>
            {/* 평면 모드: 반투명 원 2개와 두 원이 겹친 영역을 SVG로 직접 그린다. */}
            <Svg
              pointerEvents="none"
              style={[
                styles.flatSvg,
                {
                  width: flatSvgSize,
                  height: flatSvgSize,
                  left: width / 2 - flatSvgSize / 2 + 30,
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
            <View pointerEvents="none" style={[styles.angleWrap, { top: angleTop }]}>
              <Text style={[styles.angleText, styles.angleTextDark]}>{angleLabel}</Text>
            </View>
            <View pointerEvents="none" style={styles.flatGuideTextWrap}>
              <Text style={styles.flatGuideText}>{displayGuideText}</Text>
            </View>
          </>
        ) : (
          <>
            {/* 가로 모드: 흰색 면을 크게 만들고 회전시켜 색상 영역과 흰색 영역의 경계를 만든다. */}
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
            <View
              style={[
                styles.landscapeGuideAnchor,
                {
                  width: landscapeGuideAnchorWidth,
                  height: LANDSCAPE_GUIDE_ANCHOR_HEIGHT,
                  left: (width - landscapeGuideAnchorWidth) / 2 + 24,
                  top: horizonY + 16,
                  transform: [{ rotateZ: `${surfaceAngle}deg` }],
                },
              ]}
            >
              <Text style={styles.landscapeGuideText}>{displayGuideText}</Text>
            </View>
          </>
        )}

        {!isFlat ? (
          <View
            style={[
              styles.landscapeAngleAnchor,
              {
                width: landscapeAngleAnchorWidth,
                height: LANDSCAPE_ANGLE_ANCHOR_HEIGHT,
                left: (width - landscapeAngleAnchorWidth) / 2 + 28,
                top: angleTop,
                transform: [{ rotateZ: `${surfaceAngle}deg` }],
              },
            ]}
          >
            {/* 가로 모드 숫자는 화면 중앙에 고정하고, 경계선과 같은 각도로만 회전시킨다. */}
            <Text style={styles.angleText}>{angleLabel}</Text>
          </View>
        ) : null}


        <View style={styles.bottomActions}>
          <Pressable onPress={calibrate} style={styles.zeroButton}>
            <Text style={styles.zeroButtonText}>0° 보정</Text>
          </Pressable>
          <Pressable
            style={[styles.measureButton, submitting ? styles.measureButtonDisabled : null]}
            disabled={submitting}
            onPress={handleMeasurePress}
          >
            <Text style={styles.measureButtonText}>{measureButtonLabel}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
