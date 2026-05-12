import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import ToastAlert from '@/src/components/ui/ToastAlert';
import { createGuidelineGeometry } from './domain/guidelineGeometry';
import { createExpoCameraAdapter } from './camera/expoCameraAdapter';
import { CameraGuidelineOverlay } from './components/CameraGuidelineOverlay';
import { useMeasure2D } from './hooks/useMeasure2D';
import { styles } from './measure2d.styles';
import { getAccessToken } from '@/src/lib/tokenStorage';
import { useScoliometerSessionStore } from '@/src/store/scoliometerSessionStore';
import type { CurvatureResponse } from '@/src/types/curvature';
type ToastTone = 'info' | 'success' | 'warning' | 'error';

const NEXT_MEASUREMENT_ROUTE = '/measure/scoliometer';

export default function Measure2DScreen() {
  const cameraRef = useRef<any>(null);
  const permissionRequestingRef = useRef(false);
  const router = useRouter();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [showGuideText, setShowGuideText] = useState(true);
  const [stageLayout, setStageLayout] = useState({ width: 0, height: 0 });
  const [toastMessage, setToastMessage] = useState('');
  const [toastTone, setToastTone] = useState<ToastTone>('info');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const setCurvatureMeasurementId = useScoliometerSessionStore((state) => state.setCurvatureMeasurementId);
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  const [toastKey, setToastKey] = useState(0);

  const camera = useMemo(() => createExpoCameraAdapter(cameraRef), []);
  const guidelineGeometry = useMemo(() => {
    // 실제 카메라 영역 크기가 잡힌 뒤에만 가이드 기준 좌표를 계산한다.
    // 화면에 실제로 표시된 카메라 영역 크기를 기준으로 가이드 위치와 판정 좌표를 만든다.
    if (stageLayout.width <= 0 || stageLayout.height <= 0) {
      return null;
    }

    return createGuidelineGeometry(stageLayout.width, stageLayout.height);
  }, [stageLayout]);

  const {
    handleManualCapture,
    loading,
    autoAligned,
    countdown,
    autoToast,
    autoCaptureResult,
    pauseAutoCapture,
    resumeAutoCapture,
    clearAutoToast,
    clearAutoCaptureResult,
  } = useMeasure2D({
    // 자동 촬영 훅은 화면 가이드 기준 좌표를 받아 랜드마크가 가이드 영역 안에 있는지 판정한다.
    camera,
    guidePoints: guidelineGeometry?.referencePoints ?? null,
    guideRect: guidelineGeometry?.rect ?? null,
  });

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    setToastKey((current) => current + 1);
    setToastTone(tone);
    setToastMessage(message);
  }, []);

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

  const goToNextMeasurement = useCallback((curvatureMeasurementId: number) => {
    // 2D 분석 결과 id를 저장해 측만계 측정과 같은 세트로 묶는다.
    console.log('[measure2d] 척추측만계 화면으로 이동', NEXT_MEASUREMENT_ROUTE);
    setCurvatureMeasurementId(curvatureMeasurementId);
    router.push({
      pathname: NEXT_MEASUREMENT_ROUTE,
      params: {
        curvatureMeasurementId: String(curvatureMeasurementId),
      },
    });
  }, [router, setCurvatureMeasurementId]);

  const submitCurvature = useCallback(async (photoUri: string) => {
    // 자동/수동 촬영으로 확보한 최종 사진을 척추측만 분석 API에 제출한다.
    // 자동 촬영 또는 수동 촬영이 성공한 뒤 최종 사진을 척추측만 분석 API로 보낸다.
    if (!API_BASE_URL) {
      showToast('API 주소가 설정되지 않았습니다.', 'error');
      return null;
    }

    try {
      const fd = new FormData();
      fd.append('image', {
        uri: photoUri,
        name: 'upload.jpg',
        type: 'image/jpeg',
      } as any);

      const token = getAccessToken(); // tokenStorage에서
      console.log('[measure2d] curvature 요청 시작', {
        url: `${API_BASE_URL}/curvature/`,
        hasToken: Boolean(token),
        imageUriPrefix: photoUri.slice(0, 48),
      });

      const res = await fetch(`${API_BASE_URL}/curvature/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: fd,
      });

      const text = await res.text();
      console.log('curvature fetch status', res.status, text);

      if (!res.ok) {
        showToast('척추측만 분석 요청에 실패했습니다.', 'error');
        return null;
      }

      const curvature = JSON.parse(text) as CurvatureResponse;

      if (!curvature.id) {
        showToast('2D 측정 결과를 확인하지 못했습니다.', 'error');
        return null;
      }

      return curvature;
    } catch (error) {
      console.log('[measure2d] curvature 요청 예외', error);
      showToast('서버 연결에 실패했습니다. 네트워크를 확인해주세요.', 'error');
      return null;
    }
  }, [API_BASE_URL, showToast]);

  useEffect(() => {
    // 훅에서 발생한 자동 촬영 안내 메시지를 화면 공용 토스트로 옮긴다.
    // 자동 체크 중 나온 안내 문구는 화면 토스트 컴포넌트로 전달한 뒤 훅 상태에서 비운다.
    if (!autoToast) return;
    showToast(autoToast.message, autoToast.tone);
    clearAutoToast();
  }, [autoToast, clearAutoToast, showToast]);

  useEffect(() => {
    // 자동 촬영이 완료되면 사용자 입력 없이 바로 2D 분석 요청과 다음 측정 이동을 진행한다.
    // 자동 촬영이 완료되면 사용자가 버튼을 누르지 않아도 바로 척추측만 분석 요청을 시작한다.
    if (!autoCaptureResult) return;
    console.log('[measure2d] 자동 촬영 완료', autoCaptureResult);
    const submitAndNavigate = async () => {
      const curvature = await submitCurvature(autoCaptureResult.photo.uri);

      if (curvature) {
        goToNextMeasurement(curvature.id);
      }
    };

    void submitAndNavigate();
    clearAutoCaptureResult();
  }, [autoCaptureResult, clearAutoCaptureResult, goToNextMeasurement, submitCurvature]);

  const handlePressCapture = async () => {
    // 수동 촬영은 자동 촬영을 잠시 멈추고, 현재 사진이 가이드 조건을 만족할 때만 분석 요청으로 이어진다.
    // 셔터 버튼은 자동 촬영과 같은 판정 로직을 사용하되, 사용자가 누른 시점의 사진을 즉시 검사한다.
    let shouldResumeAuto = true;
    pauseAutoCapture();
    setManualSubmitting(true);

    try {
      const result = await handleManualCapture();

      if (!result) {
        showToast('촬영에 실패했습니다. 다시 시도해주세요.', 'error');
        return;
      }

      const nextEvaluation = result.evaluation;
      const firstReason = nextEvaluation.reasons[0] ?? '';

      if (nextEvaluation.aligned) {
        showToast('좋아요. 이 자세로 촬영할게요!', 'success');
        console.log('2D카메라 촬영', result);
        const curvature = await submitCurvature(result.photo.uri);

        if (curvature) {
          shouldResumeAuto = false;
          goToNextMeasurement(curvature.id);
        }

        return;
      }


      if (firstReason.includes('조금 더 가까이 와주세요')) {
        showToast('조금 더 가까이 와주세요.', 'warning');
        return;
      }

      if (firstReason.includes('조금 더 멀리 떨어져주세요')) {
        showToast('조금 더 멀리 떨어져주세요.', 'warning');
        return;
      }

      if (firstReason.includes('뒷모습이 보이게 서주세요')) {
        showToast('뒷모습이 보이게 서주세요.', 'warning');
        return;
      }

      showToast(firstReason || '가이드라인에 맞춰 다시 서주세요.', 'warning');
    } finally {
      setManualSubmitting(false);
      if (shouldResumeAuto) {
        resumeAutoCapture();
      }
    }
  };

  if (!permission) {
    return <View style={styles.screen} />;
  }

  if (!permission.granted) {
    const canAskAgain = permission.canAskAgain;

    return (
      <SafeAreaView style={styles.permissionScreen}>
        <View style={styles.permissionContent}>
          <Text style={styles.permissionTitle}>카메라 권한이 필요합니다</Text>
          <Text style={styles.permissionMessage}>
            2D 측정을 진행하려면 카메라 접근 권한을 허용해주세요.
          </Text>
          <Pressable
            style={styles.permissionButton}
            onPress={canAskAgain ? requestCameraPermission : () => Linking.openSettings()}
          >
            <Text style={styles.permissionButtonText}>{canAskAgain ? '권한 허용하기' : '설정으로 이동'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage}
        tone={toastTone}
        toastKey={toastKey}
        onDismiss={() => setToastMessage('')}
      />

      <View
        style={styles.cameraStage}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          // 레이아웃이 확정된 뒤에만 가이드 비율 계산이 가능하므로 stage 크기를 상태로 보관한다.
          // 레이아웃이 잡힌 뒤에야 가이드 비율 계산이 가능하므로 stage 크기를 상태로 보관한다.
          setStageLayout({ width, height });
        }}
      >
        <CameraView ref={cameraRef} style={styles.camera} facing="back" animateShutter={false} />
        {guidelineGeometry ? (
          <CameraGuidelineOverlay
            width={stageLayout.width}
            height={stageLayout.height}
            geometry={guidelineGeometry.display}
            // 판정 성공 상태를 넘겨 가이드 색상과 카운트다운 표시를 화면에 맞춰준다.
            aligned={autoAligned}
          />
        ) : null}
      </View>

      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        {showGuideText ? (
          <View style={styles.topBar}>
            <Pressable onPress={() => setShowGuideText(false)} hitSlop={12}>
              <Text style={styles.topText}>X</Text>
            </Pressable>
            <Text style={styles.closeText}>가이드에 맞추면 자동으로 촬영이 진행됩니다</Text>
          </View>
        ) : null}

        {autoAligned && countdown !== null && countdown > 0 ? (
          // 기준에 들어온 상태를 유지하는 동안 남은 자동 촬영 대기 시간을 보여준다.
          <View style={styles.countdownWrap}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        ) : null}

        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.shutterButton, (loading || manualSubmitting) && styles.shutterButtonDisabled]}
            onPress={handlePressCapture}
            disabled={loading || manualSubmitting}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
