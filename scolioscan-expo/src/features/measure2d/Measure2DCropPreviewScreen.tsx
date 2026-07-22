import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/src/constants/theme';
import { textFont } from '@/src/constants/fonts';
import { createPoseCrop, PoseCropError } from './services/poseCrop';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function Measure2DCropPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ photoUri?: string | string[] }>();
  const [selectingPhoto, setSelectingPhoto] = useState(false);
  const photoUri = useMemo(() => firstParam(params.photoUri), [params.photoUri]);

  const handlePickAnotherPhoto = useCallback(async () => {
    if (selectingPhoto) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    setSelectingPhoto(true);
    try {
      // 앨범 사진도 카메라 촬영과 같은 Pose 기준으로 실제 crop 파일을 생성한다.
      const cropped = await createPoseCrop(result.assets[0].uri);
      router.replace({
        pathname: '/measure-crop-preview',
        params: { photoUri: cropped.uri },
      } as any);
    } catch (error) {
      const message = error instanceof PoseCropError
        ? error.message
        : '사진을 자르지 못했습니다. 다른 사진으로 다시 시도해주세요.';
      Alert.alert('Crop 실패', message);
    } finally {
      setSelectingPhoto(false);
    }
  }, [router, selectingPhoto]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Crop 결과 테스트</Text>
          <Text style={styles.subtitle}>AI 전송 전 목부터 골반까지 잘린 결과입니다.</Text>
        </View>
        <Pressable onPress={() => router.replace('/home')} hitSlop={12}>
          <Text style={styles.close}>닫기</Text>
        </Pressable>
      </View>

      <View style={styles.imageArea}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.image} resizeMode="contain" />
        ) : (
          <Text style={styles.errorText}>Crop 결과 사진을 불러오지 못했습니다.</Text>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/measure/2d')}>
          <Text style={styles.secondaryButtonText}>다시 촬영하기</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, selectingPhoto && styles.buttonDisabled]}
          onPress={() => void handlePickAnotherPhoto()}
          disabled={selectingPhoto}
        >
          <Text style={styles.primaryButtonText}>{selectingPhoto ? 'Crop 중' : '다른 사진 선택'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary.white,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  subtitle: {
    ...textFont,
    color: Colors.gray[500],
    fontSize: 13,
    lineHeight: 20,
  },
  close: {
    ...textFont,
    color: Colors.mint[600],
    fontSize: 15,
    fontWeight: '600',
  },
  imageArea: {
    alignItems: 'center',
    backgroundColor: Colors.gray[25],
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  errorText: {
    ...textFont,
    color: Colors.red[400],
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: Colors.mint[500],
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  secondaryButtonText: {
    ...textFont,
    color: Colors.mint[600],
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  primaryButtonText: {
    ...textFont,
    color: Colors.primary.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
