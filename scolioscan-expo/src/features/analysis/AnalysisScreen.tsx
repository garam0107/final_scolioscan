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
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { SvgProps } from 'react-native-svg';

import { curvatureAPI } from '@/src/api/curvature';
import { measurementSetAPI } from '@/src/api/measurementSet';
import { rotationAPI } from '@/src/api/rotation';
import MeasurementRequiredCard from '@/src/components/MeasurementRequiredCard';
import { useAuth } from '@/src/contexts/AuthContext';
import { useMeasurementRefreshStore } from '@/src/store/measurementRefreshStore';
import type { AnalysisResponse } from '@/src/types/analysis';
import type { CurvatureResponse } from '@/src/types/curvature';
import type { MeasurementSetResponse } from '@/src/types/measurementSet';
import type { RotationResponse } from '@/src/types/rotation';
import styles from './analysis.styles';
import { createAnalysisPose, VERTEBRA_COUNT } from './analysisPose';
import {
  classifyDominantCurve,
  getDominantCurveInfo,
  getRegionalSeverity,
  getSeverityBarPercent,
  type DominantCurveInfo,
} from './severity';
import Grade1Image from '../../../assets/images/grade1.svg';
import Grade2Image from '../../../assets/images/grade2.svg';
import Grade3Image from '../../../assets/images/grade3.svg';
import Grade4Image from '../../../assets/images/grade4.svg';
import VertebraeType from '../../../assets/images/analysis/analysis_type_normal.svg'
import VertebraeDoubleMajor from '../../../assets/images/analysis/Double_major.svg';
import VertebraeDoubleThoracic from '../../../assets/images/analysis/Double_Thoracic.svg';
import VertebraeLumbar from '../../../assets/images/analysis/Lumbar.svg';
import VertebraeThoracic from '../../../assets/images/analysis/Thoracic.svg';
import VertebraeTripleCurve from '../../../assets/images/analysis/Triple_curve.svg';
import CurvePatternIcon from '../../../assets/icons/heroicons-outline_chart-bar.svg';
import AnalysisSubImage from '../../../assets/images/analysis_sub.svg';

const spineImage = require('../../../assets/images/spine.png');
const SPINE_BONE_SIZE = 72;
const SPINE_BONE_SPACING = 24;

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

type CurvePatternCopy = {
  title: string;
  body: string;
};

function getMeasurementDate(
  record:
    | Pick<CurvatureResponse, 'measured_at' | 'created_at'>
    | Pick<RotationResponse, 'measured_at' | 'created_at'>,
) {
  // 측정 시각이 있으면 우선 사용하고, 없을 때만 생성 시각을 분석 표시 기준으로 삼는다.
  return record.measured_at || record.created_at;
}

function toAnalysisFromCurvature(record: CurvatureResponse): AnalysisResponse {
  // 2D 곡률 결과를 분석 화면 공통 모델로 맞춰 화면 로직을 하나로 유지한다.
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
  // 측만계 회전 결과도 같은 분석 모델로 변환해 최신 결과 화면에서 함께 다룬다.
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

function toAnalysisFromMeasurementSet(measurementSet: MeasurementSetResponse): AnalysisResponse | null {
  // 같은 측정 세트에 2D와 측만계 결과가 함께 있을 수 있어 우선순위를 정해 하나의 분석으로 변환한다.
  if (measurementSet.curvature) {
    return toAnalysisFromCurvature(measurementSet.curvature);
  }

  if (measurementSet.rotation) {
    return toAnalysisFromRotation(measurementSet.rotation);
  }

  return null;
}

// 분기별 척추측만증 표시 함수 — 4단계 (정상/경도/중등도/고도)
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

function getCurvePatternCopy(dominantCurve: DominantCurveInfo): CurvePatternCopy {
  switch (dominantCurve.key) {
    case 'Normal':
      return {
        title: '정상 범위',
        body: '현재는 뚜렷한 지배 만곡 패턴이 보이지 않아요.',
      };
    case 'Thoracic':
      return {
        title: '흉추 만곡',
        body: '등 부위 중심으로 만곡이 나타나는 형태예요.',
      };
    case 'Double Thoracic':
      return {
        title: '이중 흉추 만곡',
        body: '상부와 주 흉추에 함께 만곡이 나타나는 형태예요.',
      };
    case 'Double major':
      return {
        title: '흉추-요추 만곡 (S자형)',
        body: '등과 허리에 반대 방향의 만곡이 있는 S자 형태예요.',
      };
    case 'Triple curve':
      return {
        title: '삼중 만곡',
        body: '상부 흉추, 주 흉추, 요추에 모두 만곡이 나타나는 형태예요.',
      };
    case 'Lumbar':
      return {
        title: '요추 만곡',
        body: '허리 부위 중심으로 만곡이 나타나는 형태예요.',
      };
    case 'Unknown':
      return {
        title: '비표준 만곡',
        body: '일반적인 분류에 딱 맞지 않는 만곡 패턴이에요.',
      };
  }
}

function getDominantCurveImageComponent(dominantCurve: DominantCurveInfo) {
  // 서버가 내려준 back_type 또는 로컬 분류 결과에 맞는 척추 유형 이미지를 고른다.
  switch (dominantCurve.key) {
    case 'Thoracic':
      return VertebraeThoracic;
    case 'Double Thoracic':
      return VertebraeDoubleThoracic;
    case 'Double major':
      return VertebraeDoubleMajor;
    case 'Triple curve':
      return VertebraeTripleCurve;
    case 'Lumbar':
      return VertebraeLumbar;
    case 'Normal':
    case 'Unknown':
      return VertebraeType;
  }
}

function CurvePatternCard({ dominantCurve }: { dominantCurve: DominantCurveInfo }) {
  const copy = getCurvePatternCopy(dominantCurve);

  return (
    <View style={styles.curvePatternCard}>
      <Text style={styles.curvePatternTitle}>곡선 패턴</Text>
      <View style={styles.curvePatternContent}>
        <View style={styles.curvePatternIconBox}>
          <CurvePatternIcon width={30} height={30} />
        </View>
        <View style={styles.curvePatternText}>
          <Text style={styles.curvePatternName}>{copy.title}</Text>
          <Text style={styles.curvePatternBody}>{copy.body}</Text>
        </View>
      </View>
    </View>
  );
}

function AiDoctorCard() {
  return (
    <View style={styles.aiDoctorSvgWrap}>
      <AnalysisSubImage width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />
    </View>
  );
}

function formatDegree(value: number) {
    return `${Math.round(Math.abs(value))}°`;
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

function CountUpNumber({
  value,
  active,
  animationKey,
}: {
  value: number;
  active: boolean;
  animationKey: number;
}) {
  // 분석 탭 재진입 시 animationKey가 바뀌면 숫자도 다시 0부터 올라간다.
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
  }, [active, animationKey, target]);

  return <Text style={styles.metricValue}>{formatDegree(displayValue)}</Text>;
}

function ArcMarker({
  x,
  vertebraIndex,
  radiusRatio,
  progress,
  stageWidth,
  stageHeight,
}: {
  x: number;
  vertebraIndex: number;
  radiusRatio: number;
  progress: Animated.Value;
  stageWidth: number;
  stageHeight: number;
}) {
  const size = stageWidth * radiusRatio * 2;
  const rigHeight = (VERTEBRA_COUNT - 1) * SPINE_BONE_SPACING + SPINE_BONE_SIZE;
  const rigTop = (stageHeight - rigHeight) / 2;
  // 원의 세로 중심은 척추뼈를 놓는 공식과 같은 기준을 사용해 기본 위치와 움직임을 맞춘다.
  const centerY = rigTop + vertebraIndex * SPINE_BONE_SPACING + SPINE_BONE_SIZE / 2;
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
          top: centerY - size / 2,
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
  animationKey,
  progress,
}: {
  metricKey: 'upper' | 'main' | 'lumbar';
  label: string;
  value: number;
  side: 'left' | 'right';
  top: number;
  xOffset: number;
  active: boolean;
  animationKey: number;
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
  <CountUpNumber value={value} active={active} animationKey={animationKey} />
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
  const boneSize = SPINE_BONE_SIZE;
  const spacing = SPINE_BONE_SPACING;
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
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [angleAnimationKey, setAngleAnimationKey] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const measurementVersion = useMeasurementRefreshStore((state) => state.version);

  const pose = useMemo(() => createAnalysisPose(analysis), [analysis]);
  const cardWidth = Math.min(width - 24, 440);
  const stageWidth = cardWidth - 20;
  const stageHeight = 380;
  const summaryName = user?.name?.trim() || '회원';
  const upperValue = pose.metrics.find((metric) => metric.key === 'upper')?.value ?? 0;
  const mainValue = pose.metrics.find((metric) => metric.key === 'main')?.value ?? 0;
  const lumbarValue = pose.metrics.find((metric) => metric.key === 'lumbar')?.value ?? 0;

  const maxCobbValue = Math.max(
    Math.abs(upperValue),
    Math.abs(mainValue),
    Math.abs(lumbarValue),
  );

  const infoCardLevel = getInfoCardLevel(maxCobbValue);
  const severityLabel = infoCardLevel;
  const infoCardCopy = getInfoCardCopy(infoCardLevel);
  const InfoCardImageComponent = infoCardCopy.ImageComponent;
  const shouldShowMeasurementRequired = !loading && !analysis && !error;

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
  const DominantCurveImageComponent = getDominantCurveImageComponent(dominantCurve);

  const startAnalysisAnimation = useCallback((duration: number) => {
    // 척추 뼈, 표시 원, 각도 숫자를 같은 타이밍으로 처음 상태에서 다시 재생한다.
    // 분석 탭에 다시 들어올 때마다 곧은 척추에서 측정 각도까지 같은 애니메이션을 반복한다.
    progress.stopAnimation();
    progress.setValue(0);
    setAngleAnimationKey((value) => value + 1);
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
          // 상세 화면은 전달받은 id와 sourceType 기준으로 정확한 분석 한 건을 불러온다.
          if (sourceType === 'rotation') {
            const response = await rotationAPI.getAnalysis(analysisId);
            targetAnalysis = toAnalysisFromRotation(response.data);
          } else {
            const response = await curvatureAPI.getAnalysis(analysisId);
            targetAnalysis = toAnalysisFromCurvature(response.data);
          }
        } else {
          // 탭 화면은 최신 2D 결과를 기준으로 연결된 측정 세트를 찾아 보여준다.
          const response = await curvatureAPI.getAnalyses({ limit: 1 });
          const latestCurvature = response.data[0] ?? null;

          if (latestCurvature) {
            const measurementSetResponse = await measurementSetAPI.getByCurvature(latestCurvature.id);
            targetAnalysis = toAnalysisFromMeasurementSet(measurementSetResponse.data);
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
  }, [analysisId, measurementVersion, progress, reloadKey, sourceType, startAnalysisAnimation]);

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
            shouldShowMeasurementRequired ? styles.measurementRequiredContent : null,
            { paddingTop: 8, paddingBottom: 16  },
          ]}
        >
          {shouldShowMeasurementRequired ? (
            <MeasurementRequiredCard />
          ) : (
            <>
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
                  vertebraIndex={arc.vertebraIndex}
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
                  animationKey={angleAnimationKey}
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
              <Pressable onPress={() => Linking.openURL('http://www.ysbrpain.com/spinalClinic/scoliosis')}>
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
                {summaryName} 님의 척추 지배만곡 유형은 {'\n'}
                <Text style={styles.dominantCurveDiagnosis}>
                  {dominantCurve.diagnosisName}
                </Text>{' '}
                {dominantCurve.key === 'Normal' ? '예요' : '이에요'}
              </Text>

              <Pressable onPress={() => Linking.openURL('http://www.ysbrpain.com/spinalClinic/scoliosis')}>
                <Text style={styles.dominantCurveLink}>더 알아보기</Text>
              </Pressable>
            </View>

            <View style={styles.dominantCurveImageWrap}>
              <DominantCurveImageComponent preserveAspectRatio="xMidYMid meet" />
            </View>
          </View>

          <CurvePatternCard dominantCurve={dominantCurve} />

          <AiDoctorCard />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
