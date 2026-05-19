import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { Colors } from '@/src/constants/theme';
import { useMeasurementGuideStore } from '@/src/store/measurementGuideStore';
import styles, { getMeasurementGuideIntroLayout } from '@/src/features/measurementGuide/intro/measurementGuideIntro.styles';

export default function MeasurementGuideIntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const layout = getMeasurementGuideIntroLayout(width, height, insets.bottom);
  const twoDGuideSeen = useMeasurementGuideStore((state) => state.twoDGuideSeen);
  const spineGuideSeen = useMeasurementGuideStore((state) => state.spineGuideSeen);
  const resetGuideSeen = useMeasurementGuideStore((state) => state.resetGuideSeen);
  const canStartMeasure = twoDGuideSeen && spineGuideSeen;

  useEffect(() => {
    return () => {
      // 인트로 화면을 벗어나면 다시 진입할 때 새로 가이드를 확인하도록 임시 체크 상태를 초기화한다.
      resetGuideSeen();
    };
  }, [resetGuideSeen]);
  

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.header, { height: layout.headerHeight }]}>
        <Pressable style={styles.headerSide} hitSlop={12} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.gray[400]} />
        </Pressable>
        <Text style={styles.headerTitle}>측정 가이드</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.content}>
        <View style={[styles.heroTextBlock, { top: layout.heroTop, width: layout.contentWidth }]}>
          <Text
            style={[
              styles.title,
              {
                width: layout.titleWidth,
                fontSize: layout.titleFontSize,
                lineHeight: layout.titleLineHeight,
              },
            ]}
          >
            ScolioScan을 처음 사용하시는 것 같아요.
          </Text>
          <Text
            style={[
              styles.description,
              {
                fontSize: layout.descriptionFontSize,
                lineHeight: layout.descriptionLineHeight,
              },
            ]}
          >
            원활한 측정을 위해 안내 가이드를 보시겠어요?
          </Text>
        </View>

        <View style={[styles.actionGroup, { top: layout.actionTop, width: layout.contentWidth }]}>
          <PrimaryButton
            title={twoDGuideSeen ? '✓ 2D 카메라 촬영 가이드 보기' : '2D 카메라 촬영 가이드 보기'}
            onPress={() => router.push('/measure/guide-2d-camera')}
            width="100%"
            height={layout.buttonHeight}
            backgroundColor={twoDGuideSeen ? Colors.mint[25] : Colors.gray[50]}
            borderRadius={6}
            style={twoDGuideSeen ? styles.completedGuideButton : styles.outlineButton} 
            textStyle={twoDGuideSeen ? styles.completedGuideButtonText : styles.outlineButtonText}  
          />
          <PrimaryButton
            title={spineGuideSeen ? '✓ 척추측만계 가이드 보기' : '척추측만계 가이드 보기'}
            onPress={() => router.push('/measure/guide-spine')}
            width="100%"
            height={layout.buttonHeight}
            backgroundColor={spineGuideSeen ? Colors.mint[25] : Colors.gray[50]}
            borderRadius={6}
            style={spineGuideSeen ? styles.completedGuideButton : styles.outlineButton} 
            textStyle={spineGuideSeen ? styles.completedGuideButtonText : styles.outlineButtonText} 
          />

          <Pressable
            style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
            onPress={() => router.back()}
          >
            <Text style={styles.skipText}>이미 사용해봤어요</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.mint[600]} />
          </Pressable>

          <View style={styles.noticeBlock}>
            <Text style={styles.noticeText}>
              {'\u2022  '}‘이미 사용해봤어요’를 누르실 경우, 가이드가 다시 표시되지 않아요.
            </Text>
            <Text style={styles.noticeText}>
              {'\u2022  '}가이드는 설정 - 가이드 버튼을 눌러서 언제든지 다시 보실 수 있어요.
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.bottomArea,
          {
            bottom: layout.bottomOffset,
          },
        ]}
      >
        <PrimaryButton
          title="측정하기"
          onPress={() => undefined}
          width="100%"
          height={layout.buttonHeight}
          disabled={!canStartMeasure}
          backgroundColor={canStartMeasure ? Colors.primary[500] : Colors.gray[100]}
          disabledBackgroundColor={Colors.gray[100]}
          borderRadius={6}
          textStyle={styles.measureButtonText}
        />
      </View>
    </SafeAreaView>
  );
}
