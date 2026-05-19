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
  ActivityIndicator
} from 'react-native';
import { useFocusEffect, useScrollToTop } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { curvatureAPI } from '@/src/api/curvature';
import { measurementSetAPI } from '@/src/api/measurementSet';
import { rotationAPI } from '@/src/api/rotation';
import MeasurementRequiredCard from '@/src/components/MeasurementRequiredCard';
import TopScrollGradient, { useTopScrollGradient } from '@/src/components/TopScrollGradient';
import { useAuth } from '@/src/contexts/AuthContext';
import { useMeasurementRefreshStore } from '@/src/store/measurementRefreshStore';
import type { AnalysisResponse } from '@/src/types/analysis';
import type { CurvatureResponse } from '@/src/types/curvature';
import type { MeasurementSetResponse } from '@/src/types/measurementSet';
import type { RotationResponse } from '@/src/types/rotation';
import {
  getCurvePatternCopy,
  getInfoCardCopy,
  type InfoCardLevel,
} from './analysisCopy';
import styles from './analysis.styles';
import { createAnalysisPose, VERTEBRA_COUNT } from './analysisPose';
import {
  classifyDominantCurve,
  getDominantCurveInfo,
  getRegionalSeverity,
  getSeverityBarPercent,
  type DominantCurveInfo,
} from './severity';
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
const WIDE_LAYOUT_MIN_WIDTH = 600;
const BASE_STAGE_WIDTH = 420;
const BASE_STAGE_HEIGHT = 380;
const STAGE_HORIZONTAL_PADDING = 20;
const SLOT_DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const SLOT_REPEAT_COUNT = 3;
// 슬롯 이동 거리는 digitFrame, digitCell 높이와 같아야 한 자리만 안정적으로 보인다.
const SLOT_ITEM_HEIGHT = 38;
const SLOT_DIGIT_ITEMS = Array.from(
  { length: SLOT_REPEAT_COUNT + 1 },
  () => SLOT_DIGITS,
).flat();

type AnalysisScreenProps = {
  analysisId?: string;
  sourceType?: string;
};

// 2D, 3D 토글
type ViewMode = '2d' | '3d';

function getWideStageScale(width: number, height: number) {
  if (width < WIDE_LAYOUT_MIN_WIDTH) return 1;

  const availableStageWidth = Math.max(1, width - 32 - STAGE_HORIZONTAL_PADDING);
  const widthScale = availableStageWidth / BASE_STAGE_WIDTH;
  const heightScale = Math.max(1, (height - 180) / BASE_STAGE_HEIGHT);

  // 태블릿에서는 화면을 꽉 쓰되 첫 화면에서 과하게 커지지 않도록 가로/세로 중 작은 배율을 사용한다.
  return Math.max(1, Math.min(widthScale, heightScale));
}

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

function SlotDigit({
  digit,
  active,
  animationKey,
  order,
}: {
  digit: number;
  active: boolean;
  animationKey: number;
  order: number;
}) {
  const step = useRef(new Animated.Value(0)).current;
  const maxStep = SLOT_REPEAT_COUNT * SLOT_DIGITS.length + 9;
  const targetStep = SLOT_REPEAT_COUNT * SLOT_DIGITS.length + digit;

  useEffect(() => {
    step.stopAnimation();

    if (!active) {
      step.setValue(targetStep);
      return;
    }

    // 숫자 슬롯은 0에서 여러 바퀴를 돈 뒤 목표 숫자에서 멈추게 해서 실제 슬롯머신처럼 보이게 한다.
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
  const target = Math.max(0, Math.round(Math.abs(value)));
  // 각도를 정수 문자열로 쪼개 자리수마다 독립적인 슬롯 애니메이션을 적용한다.
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

function ArcMarker({
  size,
  boneSize,
}: {
  size: number;
  boneSize: number;
}) {
  // 뼈 내부 중앙에 원을 올려 부모 뼈의 이동과 회전을 그대로 따라가게 합니다.
  return (
    <View
      style={[
        styles.arcMarker,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: (boneSize - size) / 2,
          top: (boneSize - size) / 2,
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.arcMarkerCenter, { width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21 }]} />
    </View>
  );
}

function MetricBlock({
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
}: {
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
}) {
  // 척추가 휘는 진행도와 같은 progress 값으로 각도 라벨도 목표 위치까지 같이 이동한다.
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, xOffset * xOffsetScale] });

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

function SpineMarker({
  x,
  rotation,
  progress,
  left,
  top,
  boneSize,
  markerSize,
}: {
  x: number;
  rotation: number;
  progress: Animated.Value;
  left: number;
  top: number;
  boneSize: number;
  markerSize: number;
}) {
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, x] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${rotation}deg`] });

  // 뼈와 같은 위치/회전 값을 쓰되 뼈 렌더링 이후에 그려 원이 항상 위에 보이게 합니다.
  return (
    <Animated.View
      style={[
        styles.spineBone,
        {
          left,
          top,
          width: boneSize,
          height: boneSize,
          zIndex: 20,
          transform: [{ translateX }, { rotate }],
        },
      ]}
      pointerEvents="none"
    >
      <ArcMarker size={markerSize} boneSize={boneSize} />
    </Animated.View>
  );
}

function SpineRig({
  progress,
  slices,
  markers,
  stageWidth,
  boneSize,
  spacing,
}: {
  progress: Animated.Value;
  slices: { x: number; rotation: number }[];
  markers: { vertebraIndex: number; radiusRatio: number }[];
  stageWidth: number;
  boneSize: number;
  spacing: number;
}) {
  const rigHeight = (VERTEBRA_COUNT - 1) * spacing + boneSize;
  const left = (stageWidth - boneSize) / 2;

  return (
    <View style={{ width: stageWidth, height: rigHeight, position: 'relative' }} pointerEvents="none">
      {slices.map((slice, index) => (
        <SpineBone
          key={`bone-${index}`}
          x={slice.x}
          rotation={slice.rotation}
          progress={progress}
          left={left}
          top={index * spacing}
          boneSize={boneSize}
        />
      ))}

      {markers.map((marker) => {
        const slice = slices[marker.vertebraIndex];

        if (!slice) {
          return null;
        }

        return (
          <SpineMarker
            key={`marker-${marker.vertebraIndex}`}
            x={slice.x}
            rotation={slice.rotation}
            progress={progress}
            left={left}
            top={marker.vertebraIndex * spacing}
            boneSize={boneSize}
            markerSize={stageWidth * marker.radiusRatio * 2}
          />
        );
      })}
    </View>
  );
}

export default function AnalysisScreen({ analysisId, sourceType }: AnalysisScreenProps) {
  const { width, height } = useWindowDimensions();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [angleAnimationKey, setAngleAnimationKey] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const topScrollGradient = useTopScrollGradient();
  const measurementVersion = useMeasurementRefreshStore((state) => state.version);

  const pose = useMemo(() => createAnalysisPose(analysis), [analysis]);
  const wideStageScale = getWideStageScale(width, height);
  const isWideLayout = width >= WIDE_LAYOUT_MIN_WIDTH;
  const cardWidth = Math.min(width - 24, 440);
  const stageWidth = isWideLayout ? BASE_STAGE_WIDTH * wideStageScale : cardWidth - 20;
  const stageHeight = isWideLayout ? BASE_STAGE_HEIGHT * wideStageScale : BASE_STAGE_HEIGHT;
  const stageBoneSize = SPINE_BONE_SIZE * wideStageScale;
  const stageBoneSpacing = SPINE_BONE_SPACING * wideStageScale;
  const metricSideInset = isWideLayout ? 52 * wideStageScale : 52;
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
    // 서버가 제공한 back_type을 우선 사용하고, 없을 때만 현재 각도로 클라이언트 분류를 수행한다.
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
      // 상세 진입이면 해당 id를, 탭 진입이면 최신 2D 기준 측정 세트를 불러와 분석 모델로 변환한다.
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
  // 현재 선택된 분석 탭을 다시 누르면 보던 위치와 상관없이 맨 위로 이동한다.
  useScrollToTop(scrollRef);
  if (loading) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
          <StatusBar style="dark" backgroundColor="#F4F6F7" translucent={false} />
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#69B7BC" />
            <Text style={styles.loadingText}>분석 결과를 불러오는 중입니다...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right', ]} style={{ flex: 1 }}>
        <StatusBar style="dark" backgroundColor="#F4F6F7" translucent={false} />

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator
          onScroll={topScrollGradient.onScroll}
          scrollEventThrottle={16}
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

          <View
            style={[
              styles.dominantCurveCard,
              isWideLayout
                ? {
                    minHeight: 136 * wideStageScale,
                    paddingLeft: 14 * wideStageScale,
                    paddingRight: 10 * wideStageScale,
                    paddingVertical: 8 * wideStageScale,
                  }
                : null,
            ]}
          >
            <View style={styles.dominantCurveText}>
              <Text style={styles.dominantCurveTitle}>척추 지배만곡 유형</Text>

              <Text style={styles.dominantCurveBody}>
                {summaryName} 님의 척추 지배만곡 유형은 {'\n'}
                <Text style={styles.dominantCurveDiagnosis}>
                  {dominantCurve.diagnosisName}
                </Text>{' '}
                {dominantCurve.key === 'Normal' ? '이에요' : '이에요'}
              </Text>

              <Pressable onPress={() => Linking.openURL('http://www.ysbrpain.com/spinalClinic/scoliosis')}>
                <Text style={styles.dominantCurveLink}>더 알아보기</Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.dominantCurveImageWrap,
                isWideLayout
                  ? {
                      width: 120 * wideStageScale,
                      height: 140 * wideStageScale,
                      marginRight: -14 * wideStageScale,
                    }
                  : null,
              ]}
            >
              <DominantCurveImageComponent preserveAspectRatio="xMidYMid meet" />
            </View>
          </View>

          <CurvePatternCard dominantCurve={dominantCurve} />

          <AiDoctorCard />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      <TopScrollGradient visible={topScrollGradient.visible} />
    </View>
  );
}
