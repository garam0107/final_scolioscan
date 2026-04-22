import React, { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';

import ToastAlert from '@/src/components/ui/ToastAlert';
import { createGuidelineGeometry } from './domain/guidelineGeometry';
import { createExpoCameraAdapter } from './camera/expoCameraAdapter';
import { CameraGuidelineOverlay } from './components/CameraGuidelineOverlay';
import { useMeasure2D } from './hooks/useMeasure2D';
import { styles } from './measure2d.styles';

type ToastTone = 'info' | 'success' | 'warning' | 'error';

export default function Measure2DScreen() {
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [showGuideText, setShowGuideText] = useState(true);
  const [stageLayout, setStageLayout] = useState({ width: 0, height: 0 });
  const [toastMessage, setToastMessage] = useState('');
  const [toastTone, setToastTone] = useState<ToastTone>('info');
  const [toastKey, setToastKey] = useState(0);

  const camera = useMemo(() => createExpoCameraAdapter(cameraRef), []);
  const guidelineGeometry = useMemo(() => {
    if (stageLayout.width <= 0 || stageLayout.height <= 0) {
      return null;
    }

    return createGuidelineGeometry(stageLayout.width, stageLayout.height);
  }, [stageLayout]);

  const { handleManualCapture, loading } = useMeasure2D({
    camera,
    guidePoints: guidelineGeometry?.referencePoints ?? null,
  });

  const showToast = (message: string, tone: ToastTone = 'info') => {
    setToastKey((current) => current + 1);
    setToastTone(tone);
    setToastMessage(message);
  };

  const handlePressCapture = async () => {
    const result = await handleManualCapture();

    if (!result) {
      showToast('촬영에 실패했습니다. 다시 시도해주세요.', 'error');
      return;
    }

    const nextEvaluation = result.evaluation;
    const firstReason = nextEvaluation.reasons[0] ?? '';

    if (nextEvaluation.aligned) {
      showToast('좋아요. 이 자세로 촬영할게요!', 'success');
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

    showToast(firstReason || '가이드라인에 맞춰 다시 서주세요.', 'info');
  };

  if (!permission) {
    return <View style={styles.screen} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.permissionTitle}>카메라 권한이 필요합니다.</Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>권한 허용</Text>
        </Pressable>
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
          setStageLayout({ width, height });
        }}
      >
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        {guidelineGeometry ? (
          <CameraGuidelineOverlay
            width={stageLayout.width}
            height={stageLayout.height}
            geometry={guidelineGeometry.display}
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

        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.shutterButton, loading && styles.shutterButtonDisabled]}
            onPress={handlePressCapture}
            disabled={loading}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
