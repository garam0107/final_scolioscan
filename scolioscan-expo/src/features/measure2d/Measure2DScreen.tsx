import React, { useRef, useState } from 'react';
import { Alert, Pressable, SafeAreaView, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { CameraGuidelineOverlay } from './components/CameraGuidelineOverlay';
import { styles } from './measure2d.styles';

export default function Measure2DScreen() {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);

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

      if (!photo?.uri) return;
      Alert.alert('촬영 완료', photo.uri);
    } catch (error) {
      Alert.alert('촬영 실패', '사진을 저장하지 못했어요.');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <CameraGuidelineOverlay />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Text style={styles.topText}>가이드라인에 맞추면 자동으로 촬영됩니다</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

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
