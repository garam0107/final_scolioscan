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
  // 카메라 프리뷰가 차지하는 실제 영역. 가이드라인 위치 계산의 기준이 된다.
  const [stageLayout, setStageLayout] = useState({ width: 0, height: 0 });

  // 카메라 구현을 어댑터로 감싸 두면, 나중에 vision-camera로 교체하기 쉽다.
  const camera = useMemo(() => createExpoCameraAdapter(cameraRef), []);
  // 표시용 geometry와 판정용 rect를 한 번 계산해서 Overlay와 landmarkRules에 공유한다.
  const guidelineGeometry = useMemo(() => {
  if (stageLayout.width <= 0 || stageLayout.height <= 0) {
    return null;
  }

  return createGuidelineGeometry(stageLayout.width, stageLayout.height);
}, [stageLayout]);

  const { evaluation, guideMessage, handleManualCapture, loading } = useMeasure2D({
  camera,
  guideRect: guidelineGeometry?.rect ?? null,
});


  if (!permission) {
    return <View style={styles.screen} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.permissionTitle}>카메라 권한이 필요해요</Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>권한 허용</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handlePressCapture = async () => {
    await handleManualCapture();
  };

  const isAligned = evaluation?.aligned ?? false;

  return (
    <View style={styles.screen}>
      <View
        style={styles.cameraStage}
        onLayout={(event) => {
          // stageLayout은 화면 크기와 가이드라인 좌표를 맞추는 기준 값이다.
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
            <Text style={styles.topText}>가이드라인에 맞추면 수동 촬영 후 판정됩니다</Text>
            <Pressable onPress={() => setShowGuideText(false)} hitSlop={12}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.guideCard}>
          <Text style={styles.guideCardText}>{guideMessage}</Text>
          <View style={styles.guideMetaRow}>
            <Text style={styles.guideMetaText}>{isAligned ? '정렬됨' : '대기 중'}</Text>
            <Text style={styles.guideMetaText}>·</Text>
            <Text style={styles.guideMetaText}>{loading ? '분석 중...' : '수동 촬영 버튼을 눌러 주세요'}</Text>
          </View>
        </View>

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
