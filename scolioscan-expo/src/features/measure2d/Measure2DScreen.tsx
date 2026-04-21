import React, { useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';

import { CameraGuidelineOverlay } from './components/CameraGuidelineOverlay';
import { styles } from './measure2d.styles';

export default function Measure2DScreen() {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [showGuideText, setShowGuideText] = useState(true);
  const [stageLayout, setStageLayout] = useState({ width: 0, height: 0 });

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

  const handleCapture = async () => {
    try {
      setCapturing(true);
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.9,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        return;
      }

      Alert.alert('촬영 완료', photo.uri);
    } catch {
      Alert.alert('촬영 실패', '사진을 저장하지 못했어요.');
    } finally {
      setCapturing(false);
    }
  };

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
        {stageLayout.width > 0 && stageLayout.height > 0 ? (
          <CameraGuidelineOverlay width={stageLayout.width} height={stageLayout.height} />
        ) : null}
      </View>

      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        {showGuideText ? (
  <View style={styles.topBar}>
    <Text style={styles.topText}>가이드라인에 맞추면 자동으로 촬영됩니다</Text>
    <Pressable onPress={() => setShowGuideText(false)} hitSlop={12}>
      <Text style={styles.closeText}>×</Text>
    </Pressable>
  </View>
) : null}

        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.shutterButton, capturing && styles.shutterButtonDisabled]}
            onPress={handleCapture}
            disabled={capturing}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
