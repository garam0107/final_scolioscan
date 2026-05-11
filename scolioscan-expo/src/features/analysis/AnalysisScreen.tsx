import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { SvgProps } from 'react-native-svg';

import { curvatureAPI } from '@/src/api/curvature';
import { rotationAPI } from '@/src/api/rotation';
import { useAuth } from '@/src/contexts/AuthContext';
import type { AnalysisResponse } from '@/src/types/analysis';
import type { CurvatureResponse } from '@/src/types/curvature';
import type { RotationResponse } from '@/src/types/rotation';
import styles from './analysis.styles';
import { createAnalysisPose, VERTEBRA_COUNT, getSeverityLabel } from './analysisPose';
import {
  classifyDominantCurve,
  getDominantCurveInfo,
  getRegionalSeverity,
  getSeverityBarPercent,
} from './severity';
import Grade1Image from '../../../assets/images/grade1.svg';
import Grade2Image from '../../../assets/images/grade2.svg';
import Grade3Image from '../../../assets/images/grade3.svg';
import Grade4Image from '../../../assets/images/grade4.svg';

const spineImage = require('../../../assets/images/spine.png');

type AnalysisScreenProps = {
  analysisId?: string;
  sourceType?: string;
};

// 2D, 3D 토글
type ViewMode = '2d' | '3d';
type InfoCardLevel = '정상' | '경도' | '중등도' | '고도';


type InfoCardCopy = {
  title: string;
  body: string;
  ImageComponent: React.ComponentType<SvgProps>;
};

function getMeasurementDate(
  record:
    | Pick<CurvatureResponse, 'measured_at' | 'created_at'>
    | Pick<RotationResponse, 'measured_at' | 'created_at'>,
) {
  return record.measured_at || record.created_at;
}

function toAnalysisFromCurvature(record: CurvatureResponse): AnalysisResponse {
  return {
    id: String(record.id),
    user_uuid: record.user_id,
    analysis_type: 1,
    main_thoracic: record.secondary_thoracic_cobb,
    second_thoracic: record.main_thoracic_cobb,
    lumbar: record.lumbar_cobb,
    score: record.score ?? null,
    image_url: record.image_path ?? null,
    created_at: getMeasurementDate(record),
    back_type: record.back_type ?? null,
  };
}

function toAnalysisFromRotation(record: RotationResponse): AnalysisResponse {
  return {
    id: String(record.id),
    user_uuid: record.user_id,
    analysis_type: 3,
    main_thoracic: record.upper_thoracic_atr,
    second_thoracic: record.thoracic_atr,
    lumbar: record.lumbar_atr,
    score: null,
    image_url: null,
    created_at: getMeasurementDate(record),
  };
}

// 분기별 척추측만증 표시 함수 — 3단계 (정상/보통/위험)
function getInfoCardCopy(infoCardLevel: InfoCardLevel): InfoCardCopy {
  switch (infoCardLevel) {
    case '정상':
      return {
        title: '정상 범위를 유지한 운동',
        body: '50분마다 간단한 스트레칭을 하고, 수영, 요가, 필라테스 등을 도전해보세요.',
        ImageComponent: Grade1Image,
      };
    case '경도':
      return {
        title: '경도 척추측만증이란?',
        body: "콥각도(cobb's angle)가 15도 이상으로 측정된 상태예요. 자세 습관을 관리하면서 변화를 확인해 주세요.",
        ImageComponent: Grade2Image,
      };
    case '중등도':
      return {
        title: '중등도 척추측만증이란?',
        body: "콥각도(cobb's angle)가 25도 이상으로 높아진 상태예요. 전문적인 진료와 관리 방향을 함께 확인해 주세요.",
        ImageComponent: Grade3Image,
      };
    case '고도':
      return {
        title: '고도 척추측만증이란?',
        body: "콥각도(cobb's angle)가 45도 이상으로 높아진 상태예요. 눈에 띌 정도로 심한 외관 변형과 심한 경우 흉곽 압박으로 심폐기능 이상을 초래할 수 있습니다.",
        ImageComponent: Grade4Image,
      };
  }
}

function formatDegree(value: number) {
  return `${Math.abs(value).toFixed(1)}°`;
}

function regionDisplayLabel(key: 'upper' | 'main' | 'lumbar'): string {
  switch (key) {
    case 'upper':
      return '상부 흉추';
    case 'main':
      return '주 흉추';
    case 'lumbar':
      return '요추';
  }
}

function CountUpNumber({ value, active }: { value: number; active: boolean }) {
  const target = Math.max(0, Math.abs(value));
  const [displayValue, setDisplayValue] = useState(target);

  useEffect(() => {
    if (!active) {
      setDisplayValue(target);
      return;
    }

    const duration = 650;
    const startTime = Date.now();
    let rafId = 0;

    const tick = () => {
      const progress = Math.min(1, (Date.now() - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(target * eased);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    setDisplayValue(0);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [active, target]);

  return <Text style={styles.metricValue}>{formatDegree(displayValue)}</Text>;
}

function ArcMarker({
  x,
  yRatio,
  radiusRatio,
  progress,
  stageWidth,
  stageHeight,
}: {
  x: number;
  yRatio: number;
  radiusRatio: number;
  progress: Animated.Value;
  stageWidth: number;
  stageHeight: number;
}) {
  const size = stageWidth * radiusRatio * 2;
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, x] });

  return (
    <Animated.View
      style={[
        styles.arcMarker,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: (stageWidth - size) / 2,
          top: stageHeight * yRatio - size / 2,
          transform: [{ translateX }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.arcMarkerCenter, { width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21 }]} />
    </Animated.View>
  );
}

function MetricBlock({
  metricKey,
  label,
  value,
  side,
  top,
  xOffset,
  active,
  progress,
}: {
  metricKey: 'upper' | 'main' | 'lumbar';
  label: string;
  value: number;
  side: 'left' | 'right';
  top: number;
  xOffset: number;
  active: boolean;
  progress: Animated.Value;
}) {
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, xOffset] });

  return (
    <Animated.View
      style={[
        styles.metric,
        {
          top,
          left: side === 'left' ? 52 : undefined,
          right: side === 'right' ? 52 : undefined,
          transform: [{ translateX }],
        },
      ]}
    >
      <View style={side === 'left' ? styles.metricLeft : styles.metricRight}>
        <Text style={styles.metricLabel}>{label}</Text>
        <View
  style={[
    styles.valueRow,
    metricKey === 'main' && { transform: [{ translateX: 8 }] },
    metricKey === 'lumbar' && { transform: [{ translateX: 20 }] },
  ]}
>
  <CountUpNumber value={value} active={active} />
</View>

      </View>
    </Animated.View>
  );
}

function SpineBone({
  x,
  rotation,
  progress,
  left,
  top,
  boneSize,
}: {
  x: number;
  rotation: number;
  progress: Animated.Value;
  left: number;
  top: number;
  boneSize: number;
}) {
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, x] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${rotation}deg`] });

  return (
    <Animated.View
      style={[
        styles.spineBone,
        {
          left,
          top,
          width: boneSize,
          height: boneSize,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ translateX }, { rotate }],
        },
      ]}
      pointerEvents="none"
    >
      <Image source={spineImage} style={{ width: boneSize, height: boneSize }} resizeMode="contain" />
    </Animated.View>
  );
}

function SpineRig({
  progress,
  slices,
  stageWidth,
}: {
  progress: Animated.Value;
  slices: { x: number; rotation: number }[];
  stageWidth: number;
}) {
  const boneSize = 72;
  const spacing = 24;
  const rigHeight = (VERTEBRA_COUNT - 1) * spacing + boneSize;
  const left = (stageWidth - boneSize) / 2;

  return (
    <View style={{ width: stageWidth, height: rigHeight, position: 'relative' }} pointerEvents="none">
      {slices.map((slice, index) => (
        <SpineBone
          key={index}
          x={slice.x}
          rotation={slice.rotation}
          progress={progress}
          left={left}
          top={index * spacing}
          boneSize={boneSize}
        />
      ))}
    </View>
  );
}

export default function AnalysisScreen({ analysisId, sourceType }: AnalysisScreenProps) {
  const { width } = useWindowDimensions();
  const bottomTabBarHeight = useBottomTabBarHeight();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  const pose = useMemo(() => createAnalysisPose(analysis), [analysis]);
  const cardWidth = Math.min(width - 24, 440);
  const stageWidth = cardWidth - 20;
  const stageHeight = 380;
  const summaryName = user?.name?.trim() || '회원';
  const upperValue = pose.metrics.find((metric) => metric.key === 'upper')?.value ?? 0;
  const mainValue = pose.metrics.find((metric) => metric.key === 'main')?.value ?? 0;
  const lumbarValue = pose.metrics.find((metric) => metric.key === 'lumbar')?.value ?? 0;
const severityLabel = getSeverityLabel(upperValue);

const maxCobbValue = Math.max(
  Math.abs(upperValue),
  Math.abs(mainValue),
  Math.abs(lumbarValue),
);

const infoCardLevel = getInfoCardLevel(maxCobbValue);
const infoCardCopy = getInfoCardCopy(infoCardLevel);
const InfoCardImageComponent = infoCardCopy.ImageComponent;

  function getInfoCardLevel(value: number): InfoCardLevel {
    const maxValue = Math.abs(value);
    if (maxValue < 15) return '정상';
    if (maxValue < 25) return '경도';
    if (maxValue < 45) return '중등도';
    return '고도';
  }

  // back_type 우선, 없으면 클라이언트 분류 — 인자 순서: (secondary, main, lumbar) = (upper, main, lumbar)
  const dominantCurve = useMemo(() => {
    if (analysis?.back_type) return getDominantCurveInfo(analysis.back_type);
    return classifyDominantCurve(upperValue, mainValue, lumbarValue);
  }, [analysis?.back_type, upperValue, mainValue, lumbarValue]);

  const startAnalysisAnimation = useCallback((duration: number) => {
    // 분석 탭에 다시 들어올 때마다 곧은 척추에서 측정 각도까지 같은 애니메이션을 반복한다.
    progress.stopAnimation();
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  useEffect(() => {
    let mounted = true;

    async function loadLatest() {
      setLoading(true);
      setError(null);

      try {
        let targetAnalysis: AnalysisResponse | null = null;

        if (analysisId) {
          if (sourceType === 'rotation') {
            const response = await rotationAPI.getAnalysis(analysisId);
            targetAnalysis = toAnalysisFromRotation(response.data);
          } else {
            const response = await curvatureAPI.getAnalysis(analysisId);
            targetAnalysis = toAnalysisFromCurvature(response.data);
          }
        } else {
          const [curvatureResult, rotationResult] = await Promise.allSettled([
            curvatureAPI.getAnalyses({ limit: 1 }),
            rotationAPI.getAnalyses({ limit: 1 }),
          ]);

          const latestCurvature =
            curvatureResult.status === 'fulfilled' ? curvatureResult.value.data[0] ?? null : null;
          const latestRotation =
            rotationResult.status === 'fulfilled' ? rotationResult.value.data[0] ?? null : null;

          if (latestCurvature && latestRotation) {
            targetAnalysis =
              new Date(getMeasurementDate(latestCurvature)).getTime() >=
              new Date(getMeasurementDate(latestRotation)).getTime()
                ? toAnalysisFromCurvature(latestCurvature)
                : toAnalysisFromRotation(latestRotation);
          } else if (latestCurvature) {
            targetAnalysis = toAnalysisFromCurvature(latestCurvature);
          } else if (latestRotation) {
            targetAnalysis = toAnalysisFromRotation(latestRotation);
          }
        }

        if (!mounted) return;

        setAnalysis(targetAnalysis ?? null);
        startAnalysisAnimation(targetAnalysis ? 1600 : 0);
      } catch {
        if (!mounted) return;
        setAnalysis(null);
        setError('최신 분석 결과를 불러오지 못했어요.');
        progress.setValue(0);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadLatest();

    return () => {
      mounted = false;
    };
  }, [analysisId, progress, reloadKey, sourceType, startAnalysisAnimation]);

  useFocusEffect(
    useCallback(() => {
      if (analysis) {
        startAnalysisAnimation(1600);
      }
    }, [analysis, startAnalysisAnimation]),
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right', ]} style={{ flex: 1 }}>
        <StatusBar style="dark" backgroundColor="#F4F6F7" translucent={false} />

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator
          contentContainerStyle={[
            styles.content,
            { paddingTop: 8, paddingBottom: 20  },
          ]}
        >
          <View style={styles.summaryTextBlock}>
            <Text style={styles.summaryNameLine}>{summaryName} 님은</Text>
            <Text style={styles.summaryDiagnosisLine}>
              <Text style={styles.summarySeverityBold}>{severityLabel} 척추측만증</Text>으로 예상 됩니다
            </Text>
          </View>

          <View style={[styles.stage, { height: stageHeight }]}>
            <View style={styles.spineLayer}>
              <SpineRig progress={progress} slices={pose.vertebrae} stageWidth={stageWidth} />
            </View>

            <View style={styles.overlayLayer} pointerEvents="none">
              {pose.arcs.map((arc) => (
                <ArcMarker
                  key={arc.key}
                  x={arc.x}
                  yRatio={arc.yRatio}
                  radiusRatio={arc.radiusRatio}
                  progress={progress}
                  stageWidth={stageWidth}
                  stageHeight={stageHeight}
                />
              ))}
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
                  active={Boolean(analysis)}
                  progress={progress}
                />

              ))}

              {!analysis && !loading ? (
                <Text style={styles.emptyText}>최근 측정 결과가 없어요. 먼저 측정을 진행해 주세요.</Text>
              ) : null}

              {error ? (
                <>
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable style={styles.retryButton} onPress={() => setReloadKey((value) => value + 1)}>
                    <Text style={styles.retryText}>다시 시도</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoCardText}>
              <Text style={styles.infoCardTitle}>{infoCardCopy.title}</Text>
              <Text style={styles.infoCardBody}>{infoCardCopy.body}</Text>
              <Pressable onPress={() => Linking.openURL('https://naver.com')}>
                <Text style={styles.infoCardLink}>더 알아보기</Text>
              </Pressable>
            </View>

            <View style={styles.infoCardImageWrap}>
              <InfoCardImageComponent preserveAspectRatio="xMidYMid meet" />
            </View>
          </View>

          <View style={styles.severityCard}>
            <Text style={styles.severityCardTitle}>심각도 분석</Text>

            <View style={styles.severityCardInner}>
              {pose.metrics.map((metric, index) => {
                const severity = getRegionalSeverity(metric.value);
                const isLast = index === pose.metrics.length - 1;

                return (
                  <View key={metric.key} style={styles.severityRow}>
                    <Text style={styles.severityRegionLabel}>
                      {regionDisplayLabel(metric.key)}
                    </Text>

                    <View style={styles.severityValueRow}>
                      <Text style={styles.severityCurvatureLabel}>만곡도</Text>
                      <Text style={styles.severityValue}>{formatDegree(metric.value)}</Text>

                      <View
                        style={[
                          styles.severityBadge,
                          { backgroundColor: severity.badgeBackground },
                        ]}
                      >
                        <Text
                          style={[
                            styles.severityBadgeText,
                            { color: severity.badgeTextColor },
                          ]}
                        >
                          {severity.label}
                        </Text>
                      </View>

                      <View style={styles.severityBarWrap}>
                        <View
                          style={[
                            styles.severityTrack,
                            { backgroundColor: severity.trackColor },
                          ]}
                        >
                          <View
                            style={[
                              styles.severityFill,
                              {
                                width: `${getSeverityBarPercent(metric.value)}%`,
                                backgroundColor: severity.barColor,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>

                    {!isLast ? <View style={styles.severityDivider} /> : null}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.dominantCurveCard}>
            <View style={styles.dominantCurveText}>
              <Text style={styles.dominantCurveTitle}>척추 지배만곡 유형</Text>

              <Text style={styles.dominantCurveBody}>
                {summaryName} 님의 척추 지배만곡 유형은{' '}
                <Text style={styles.dominantCurveDiagnosis}>
                  {dominantCurve.diagnosisName}
                </Text>{' '}
                {dominantCurve.key === 'Normal' ? '예요' : '이에요'}
              </Text>

              <Pressable onPress={() => Linking.openURL('https://naver.com')}>
                <Text style={styles.dominantCurveLink}>더 알아보기</Text>
              </Pressable>
            </View>

            <View style={styles.dominantCurveImageWrap}>
              <Grade1Image preserveAspectRatio="xMidYMid meet" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
