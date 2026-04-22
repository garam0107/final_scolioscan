import React, { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { createGuidelineGeometry } from './domain/guidelineGeometry';
import { createExpoCameraAdapter } from './camera/expoCameraAdapter';
import { CameraGuidelineOverlay } from './components/CameraGuidelineOverlay';
import { useMeasure2D } from './hooks/useMeasure2D';
import { styles } from './measure2d.styles';

export default function Measure2DScreen() {
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [showGuideText, setShowGuideText] = useState(true);
  const [stageLayout, setStageLayout] = useState({ width: 0, height: 0 });

  const camera = useMemo(() => createExpoCameraAdapter(cameraRef), []);
  const guidelineGeometry = useMemo(() => {
    if (stageLayout.width <= 0 || stageLayout.height <= 0) {
      return null;
    }

    return createGuidelineGeometry(stageLayout.width, stageLayout.height);
  }, [stageLayout]);

  const { evaluation, guideMessage, handleManualCapture, loading } = useMeasure2D({
    camera,
    guidePoints: guidelineGeometry?.referencePoints ?? null,
  });

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

  const isAligned = evaluation?.aligned ?? false;

  return (
    <View style={styles.screen}>
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
              <Text style={styles.closeText}>가이드에 맞추면 자동으로 촬영이 진행됩니다.</Text>        
          </View>
        ) : null}

        {/* <View style={styles.guideCard}>
          <Text style={styles.guideCardText}>{guideMessage}</Text>
          <View style={styles.guideMetaRow}>
            <Text style={styles.guideMetaText}>{isAligned ? '정렬 완료' : '대기 중'}</Text>
            <Text style={styles.guideMetaText}> · </Text>
            <Text style={styles.guideMetaText}>
              {loading ? '분석 중...' : '촬영 버튼을 눌러 주세요.'}
            </Text>
          </View>
        </View> */}

        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.shutterButton, loading && styles.shutterButtonDisabled]}
            onPress={handleManualCapture}
            disabled={loading}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
