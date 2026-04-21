import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  DimensionValue,
  Easing,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { SvgProps } from 'react-native-svg';

import BottomTabBar from '@/src/components/BottomTabBar';
import { curvatureAPI } from '@/src/api/curvature';
import { rotationAPI } from '@/src/api/rotation';
import type { AnalysisResponse } from '@/src/types/analysis';
import type { CurvatureResponse } from '@/src/types/curvature';
import type { RotationResponse } from '@/src/types/rotation';
import styles from './analysis.styles';
import { createAnalysisPose, VERTEBRA_COUNT, getSeverityLabel } from './analysisPose';
import Grade1Image from '../../../assets/images/grade1.svg';
import Grade2Image from '../../../assets/images/grade2.svg';
import Grade3Image from '../../../assets/images/grade3.svg';
import Grade4Image from '../../../assets/images/grade4.svg';

const spineImage = require('../../../assets/images/spine.png');

type AnalysisScreenProps = {
  analysisId?: string;
  sourceType?: string;
};

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

// 분기별 척추측만증 표시 함수
function getInfoCardCopy(severityLabel: string):  InfoCardCopy {
  switch (severityLabel) {
    case '정상':
      return {
        title: '정상 범위를 유지한 운동',
        body: '50분마다 간단한 스트레칭을 하고, 수영, 요가, 필라테스 등을 도전해보세요.',
        ImageComponent: Grade1Image,
      };
    case '경도':
      return {
        title: '경도 척추측만증이란?',
        body: "콥각도(cobb's angle)가 10도 이상으로 측정된 상태예요. 자세 습관을 관리하면서 변화를 확인해 주세요.",
        ImageComponent: Grade2Image,
      };
    case '중등도':
      return {
        title: '중등도 척추측만증이란?',
        body: "콥각도(cobb's angle)가 20도 이상으로 흉추의 심한 변형과 요추 및 골반까지 신체적 불균형이 심해집니다.",
        ImageComponent: Grade3Image,
      };
    case '고도':
      return {
        title: '고도 척추측만증이란?',
        body: "콥각도(cobb's angle)가 45도 이상으로 높아진 상태예요. 전문적인 진료와 관리 방향을 함께 확인해 주세요.",
        ImageComponent: Grade4Image,
      };
    default:
      return {
        title: '고도 척추측만증이란?',
        body: "콥각도(cobb's angle)가 45도 이상으로 높아진 상태예요. 전문적인 진료와 관리 방향을 함께 확인해 주세요.",
        ImageComponent: Grade4Image,
      };
  }
}
// 심각도 분석 표시 함수
type SeverityBadgeConfig = {
  label: '정상' | '보통' | '위험';
  badgeBackground: string;
  badgeTextColor: string;
  barColor: string;
};

function getSeverityBadgeConfig(value: number): SeverityBadgeConfig {
  if (value > 40) {
    return {
      label: '위험',
      badgeBackground: '#FFEDF0',
      badgeTextColor: '#F97B7B',
      barColor: '#F97B7B',
    };
  }

  if (value >= 25 && value <= 40) {
    return {
      label: '보통',
      badgeBackground: '#FEF8DF',
      badgeTextColor: '#FABE00',
      barColor: '#FAD342',
    };
  }

  return {
    label: '정상',
    badgeBackground: '#D7F9F9',
    badgeTextColor: '#22BCB7',
    barColor: '#22BCB7',
  };
}

function getSeverityBarWidth(value: number): DimensionValue {
  const clamped = Math.max(0, Math.min(45, value));
  return `${(clamped / 50) * 100}%` as const;
}

function formatDegree(value: number) {
  return `${Math.abs(value).toFixed(1)}°`;
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

function MetricBlock({
  metricKey,
  label,
  value,
  side,
  top,
  xOffset,
  active,
}: {
  metricKey: 'upper' | 'main' | 'lumbar';
  label: string;
  value: number;
  side: 'left' | 'right';
  top: number;
  xOffset: number;
  active: boolean;
}) {

  return (
    <View
      style={[
        styles.metric,
        {
          top,
          left: side === 'left' ? 52 + xOffset : undefined,
          right: side === 'right' ? 52 + xOffset : undefined,
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
    </View>
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
  const boneSize = 56;
  const spacing = 22;
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
  const insets = useSafeAreaInsets();
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  const pose = useMemo(() => createAnalysisPose(analysis), [analysis]);

  const cardWidth = Math.min(width - 24, 440);
  const stageWidth = cardWidth - 20;
  const stageHeight = 318;
  const summaryName = '회원님';
  const upperValue = pose.metrics.find((metric) => metric.key === 'upper')?.value ?? 0;
  const severityLabel = getSeverityLabel(upperValue);
  const infoCardCopy = getInfoCardCopy(severityLabel);
  const InfoCardImageComponent = infoCardCopy.ImageComponent;

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
        progress.setValue(0);
        Animated.timing(progress, {
          toValue: 1,
          duration: targetAnalysis ? 1600 : 0,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
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
  }, [analysisId, progress, reloadKey, sourceType]);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <StatusBar style="dark" backgroundColor="#F4F6F7" translucent={false} />

        <ScrollView
          showsVerticalScrollIndicator
          contentContainerStyle={[
            styles.content,
            { paddingTop: 8, paddingBottom: insets.bottom + 90 },
          ]}
        >
          <View style={styles.summaryTextBlock}>
            <Text style={styles.summaryNameLine}>{summaryName}</Text>
            <Text style={styles.summaryDiagnosisLine}>
              <Text style={styles.summarySeverityBold}>{severityLabel} 척추측만증</Text>입니다.
            </Text>
          </View>

          <View style={[styles.stage, { height: stageHeight }]}>
            <View style={styles.spineLayer}>
              <SpineRig progress={progress} slices={pose.vertebrae} stageWidth={stageWidth} />
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
                const severity = getSeverityBadgeConfig(metric.value);

                return (
                  <View
                    key={metric.key}
                    style={[
                      styles.severityRow,
                      index === pose.metrics.length - 1 && styles.severityRowLast,
                    ]}
                  >
                    <View style={styles.severityHeader}>
                      <Text style={styles.severityLabel}>{metric.label}</Text>

                      <View style={styles.severityRight}>
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
                      </View>
                    </View>

                    <View style={styles.severityTrack}>
                      <View
                        style={[
                          styles.severityFill,
                          {
                            width: getSeverityBarWidth(metric.value),
                            backgroundColor: severity.barColor,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
             {/* 척추 지배만곡 유형 카드 들어갈 예정 */}
  {/* 곡선 패턴 카드 들어갈 예정 */}
  {/* 의사 소견 카드 들어갈 예정 */}
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomTabBar />
    </View>
  );
}
