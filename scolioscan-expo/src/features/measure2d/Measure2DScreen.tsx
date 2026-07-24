import { i18n } from '@/src/i18n';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import ToastAlert from '@/src/components/ui/ToastAlert';
import { Colors } from '@/src/constants/theme';
import { createGuidelineGeometry } from './domain/guidelineGeometry';
import { createExpoCameraAdapter } from './camera/expoCameraAdapter';
import { useMeasure2D } from './hooks/useMeasure2D';
import { createPoseCrop, PoseCropError } from './services/poseCrop';
import CloseIcon from '../../../assets/icons/close.svg'
import { useCaptureCompletionFlow } from './hooks/useCaptureCompletionFlow';
import { CaptureProgressOverlay } from './components/CaptureProgressOverlay';
import { AutoGuideStatusChip } from './components/AutoGuideStatusChip';
import { Measure2DCameraStage } from './components/Measure2DCameraStage';
import { Measure2DPermissionView } from './components/Measure2DPermissionView';
import { styles } from './measure2d.styles';
type ToastTone = 'info' | 'success' | 'warning' | 'error';
type GuideChipState = {
  message: string;
  tone: ToastTone;
  key: number;
};

const NEXT_MEASUREMENT_ROUTE = '/measure-loading-preview';
const GUIDE_TOP_BAR_HEIGHT = 116;
const SHUTTER_BUTTON_SIZE = 78;
const SHUTTER_BOTTOM_PADDING = 34;
const GUIDE_CHIP_SHUTTER_GAP = 24;
const GUIDE_TOP_GAP = 40;

export default function Measure2DScreen() {
  const cameraRef = useRef<any>(null);
  const permissionRequestingRef = useRef(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // 카메라 준비 상태
  const [cameraReady, setCameraReady] = useState(false);
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [showGuideText] = useState(true);
  const [stageLayout, setStageLayout] = useState({ width: 0, height: 0 });
  const [toastMessage, setToastMessage] = useState('');
  const [toastTone, setToastTone] = useState<ToastTone>('info');
  const [manualGuideChip, setManualGuideChip] = useState<GuideChipState | null>(null);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const manualSubmittingRef = useRef(false);
  const [toastKey, setToastKey] = useState(0);
  const camera = useMemo(() => createExpoCameraAdapter(cameraRef), []);
  const guidelineGeometry = useMemo(() => {
    // 실제 카메라 영역 크기가 잡힌 뒤에만 가이드 기준 좌표를 계산한다.
    // 화면에 실제로 표시된 카메라 영역 크기를 기준으로 가이드 위치와 판정 좌표를 만든다.
    if (stageLayout.width <= 0 || stageLayout.height <= 0) {
      return null;
    }

    return createGuidelineGeometry(stageLayout.width, stageLayout.height, {
      // 상단 안내 막대와 기기 상단 여백을 피해 가이드가 텍스트를 침범하지 않게 한다.
      topReservedHeight: insets.top + GUIDE_TOP_BAR_HEIGHT + GUIDE_TOP_GAP,
      // 기기 하단 여백 위를 가이드 하단 기준선으로 사용한다.
      bottomReservedHeight: insets.bottom,
    });
  }, [insets.bottom, insets.top, stageLayout]);
  const autoCaptureLottieLayout = useMemo(() => {
    if (!guidelineGeometry) {
      return null;
    }

    const { guideX, guideY, guideWidth, guideHeight } = guidelineGeometry.display;
    // 가이드라인의 실제 화면 좌표를 기준으로 성공 체크 애니메이션을 가슴 중앙에 고정한다.
    const size = Math.min(Math.max(guideWidth * 2.65, 620), 900);
    const centerX = guideX + guideWidth / 2;
    const centerY = guideY + guideHeight * 0.36;

    return {
      left: centerX - size / 2,
      top: centerY - size / 2,
      width: size,
      height: size,
    };
  }, [guidelineGeometry]);

  const {
    handleManualCapture,
    loading,
    autoAligned,
    autoToast,
    autoCaptureResult,
    autoHoldProgress,
    pauseAutoCapture,
    resumeAutoCapture,
    clearAutoToast,
    clearAutoCaptureResult,
  } = useMeasure2D({
    // 자동 촬영 훅은 화면 가이드 기준 좌표를 받아 랜드마크가 가이드 영역 안에 있는지 판정한다.
    camera,
    guidePoints: guidelineGeometry?.referencePoints ?? null,
    guideRect: guidelineGeometry?.rect ?? null,
    previewSize: stageLayout.width > 0 && stageLayout.height > 0 ? stageLayout : null,
    cameraReady
  });

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    // 같은 문구가 연속으로 와도 ToastAlert가 다시 나타나도록 key를 증가시킨다.
    setToastKey((current) => current + 1);
    setToastTone(tone);
    setToastMessage(message);
  }, []);

  const clearManualGuideChip = useCallback(() => {
    setManualGuideChip(null);
  }, []);

  const showManualGuideChip = useCallback((message: string, tone: ToastTone = 'info') => {
    // 수동 촬영 안내도 자동 촬영 안내와 같은 칩을 쓰도록 별도 상태로 관리한다.
    clearAutoToast();
    setManualGuideChip((current) => ({
      message,
      tone,
      key: (current?.key ?? 0) + 1,
    }));
  }, [clearAutoToast]);

  const requestCameraPermission = useCallback(async () => {
    if (permissionRequestingRef.current) {
      return;
    }

    permissionRequestingRef.current = true;

    try {
      // 화면에 다시 들어올 때마다 최신 권한 상태를 확인한 뒤 요청 창을 다시 띄운다.
      const currentPermission = await getPermission();

      if (currentPermission.granted || !currentPermission.canAskAgain) {
        return;
      }

      await requestPermission();
    } finally {
      permissionRequestingRef.current = false;
    }
  }, [getPermission, requestPermission]);

  useFocusEffect(
    useCallback(() => {
      // 권한을 취소한 뒤 다시 진입하는 경우에도 검은 화면에 머무르지 않고 권한 요청을 재시도한다.
      void requestCameraPermission();
    }, [requestCameraPermission]),
  );

  const goToNextMeasurement = useCallback(async (photoUri: string) => {
    try {
      // 가이드 판정을 통과한 최종 사진을 Pose 기반으로 자른 뒤 운영 분석 화면으로 전달한다.
      const cropped = await createPoseCrop(photoUri);
      router.replace({
        pathname: NEXT_MEASUREMENT_ROUTE,
        params: {
          photoUri: cropped.uri,
        },
      } as any);
      return true;
    } catch (error) {
      const message = error instanceof PoseCropError
        ? error.message
        : '사진을 자르지 못했습니다. 다시 촬영해주세요.';
      showToast(message, 'error');
      return false;
    }
  }, [router, showToast]);

  const {
    activeCaptureLottieType,
    captureCompleteVisible,
    isCaptureFlowBusy,
    startManualCaptureFlow,
    handleCaptureLottieFinish,
  } = useCaptureCompletionFlow({
    autoAligned,
    autoCaptureResult,
    clearAutoCaptureResult,
    goToNextMeasurement,
    onPrepareFailed: resumeAutoCapture,
  });

  const handlePressCapture = async () => {
    // 수동 촬영은 자동 촬영을 잠시 멈추고, 현재 사진이 가이드 조건을 만족할 때만 분석 요청으로 이어진다.
    // 상태 렌더링 전에 들어오는 빠른 연속 탭도 동기 ref로 조용히 무시한다.
    if (manualSubmittingRef.current) {
      return;
    }

    let shouldResumeAuto = true;
    manualSubmittingRef.current = true;
    pauseAutoCapture();
    setManualSubmitting(true);

    try {
      const attempt = await handleManualCapture();

      if (attempt.status === 'ignored') {
        return;
      }

      if (attempt.status === 'busy-timeout') {
        showToast(i18n.t("카메라 처리 중입니다. 잠시 후 다시 시도해주세요."), 'info');
        return;
      }

      if (attempt.status === 'failed') {
        console.log('[measure2d] 수동 촬영 실패 토스트 표시');
        showToast(i18n.t("촬영에 실패했습니다. 다시 시도해주세요."), 'error');
        return;
      }

      const result = attempt.result;
      const nextEvaluation = result.evaluation;
      const firstReason = nextEvaluation.reasons[0] ?? '';

      if (nextEvaluation.aligned) {
        // 수동 촬영이 통과하면 자동 촬영과 같은 위치에 Lottie를 띄우고 완료 UI 이후 제출한다.
        showManualGuideChip(i18n.t("좋아요. 이 자세로 촬영할게요!"), 'success');
        shouldResumeAuto = false;
        startManualCaptureFlow(result.photo.uri);

        return;
      }


      if (firstReason.includes('조금 더 가까이 와주세요')) {
        showManualGuideChip(i18n.t("조금 더 가까이 와주세요."), 'warning');
        return;
      }

      if (firstReason.includes('조금 더 멀리 떨어져주세요')) {
        showManualGuideChip(i18n.t("조금 더 멀리 떨어져주세요."), 'warning');
        return;
      }

      if (firstReason.includes('뒷모습이 보이게 서주세요')) {
        showManualGuideChip(i18n.t("뒷모습이 보이게 서주세요."), 'warning');
        return;
      }

      showManualGuideChip(firstReason || '가이드라인에 맞춰 다시 서주세요.', 'warning');
    } finally {
      manualSubmittingRef.current = false;
      setManualSubmitting(false);
      if (shouldResumeAuto) {
        resumeAutoCapture();
      }
    }
  };

  const activeGuideChip = manualGuideChip ?? autoToast;
  const guideChipBottomOffset = insets.bottom + SHUTTER_BOTTOM_PADDING + SHUTTER_BUTTON_SIZE + GUIDE_CHIP_SHUTTER_GAP;
  const handleGuideChipDismiss = useCallback(() => {
    // 수동 촬영 뒤 자동 안내가 다시 들어와도 이전 수동 문구가 되살아나지 않도록 둘 다 비운다.
    clearAutoToast();
    clearManualGuideChip();
  }, [clearAutoToast, clearManualGuideChip]);

  if (!permission) {
    return <View style={styles.screen} />;
  }

  if (!permission.granted) {
    const canAskAgain = permission.canAskAgain;

    return (
      <Measure2DPermissionView
        canAskAgain={canAskAgain}
        onPress={canAskAgain ? requestCameraPermission : () => Linking.openSettings()}
      />
    );
  }

  const captureActionDisabled =
    !cameraReady ||
    loading ||
    manualSubmitting ||
    isCaptureFlowBusy;

  return (
    <View style={styles.screen}>
      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage}
        tone={toastTone}
        toastKey={toastKey}
        onDismiss={() => setToastMessage('')}
      />

      <Measure2DCameraStage
        cameraRef={cameraRef}
        stageLayout={stageLayout}
        guidelineGeometry={guidelineGeometry}
        autoAligned={autoAligned}
        onStageLayoutChange={setStageLayout}
        onCameraReady={() => {
          setCameraReady(true);
        }}
        onCameraMountError={(message) => {
          setCameraReady(false);
          showToast(i18n.t("카메라를 시작하지 못했습니다. 앱을 다시 열어주세요."), 'error');
        }}
      />

      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
   
            <View style={styles.topBar}>
                   {showGuideText ? (
                    <>
              <Pressable
                style={styles.topIconButton}
                onPress={() => router.back()}
                hitSlop={12}
              >
                <CloseIcon width={24} height={24} />
              </Pressable>
              <Text style={styles.closeText}>{i18n.t("가이드라인에 맞추면")}{' '}
                <Text style={styles.closeTextBold}>{i18n.t("자동으로 촬영이 진행")}</Text>{i18n.t("됩니다")}</Text>
              </>
               ) : null}
      </View>
       
        <AutoGuideStatusChip
          message={activeGuideChip?.message ?? null}
          tone={activeGuideChip?.tone ?? 'info'}
          toastKey={activeGuideChip?.key ?? 0}
          bottomOffset={guideChipBottomOffset}
          onDismiss={handleGuideChipDismiss}
        />

        <CaptureProgressOverlay
          activeType={activeCaptureLottieType}
          completeVisible={captureCompleteVisible}
          layout={autoCaptureLottieLayout}
          autoHoldProgress={autoHoldProgress}
          onLottieFinish={handleCaptureLottieFinish}
        />

        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.shutterButton, captureActionDisabled && styles.shutterButtonDisabled]}
            onPress={handlePressCapture}
            disabled={captureActionDisabled}
          >
            {manualSubmitting ? (
              <ActivityIndicator color={Colors.primary[500]} />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
