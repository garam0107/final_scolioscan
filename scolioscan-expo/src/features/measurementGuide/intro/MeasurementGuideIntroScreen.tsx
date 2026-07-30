import { i18n } from '@/src/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { Colors } from '@/src/constants/theme';
import { useMeasurementGuideStore } from '@/src/store/measurementGuideStore';
import styles, { getMeasurementGuideIntroLayout } from '@/src/features/measurementGuide/intro/measurementGuideIntro.styles';

export default function MeasurementGuideIntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const layout = getMeasurementGuideIntroLayout(width, insets.bottom);
  const { measurementType } = useLocalSearchParams<{ measurementType?: string }>();
  const isScoliometer = measurementType === 'scoliometer';
  const guideRoute = isScoliometer ? '/measure/guide-spine' : '/measure/guide-2d-camera';
  const guideButtonTitle = isScoliometer ? '정교한 측정 가이드 보기' : '카메라로 측정 가이드 보기';
  const measureRoute = isScoliometer ? '/measure/scoliometer' : '/measure/2d';
  const completeTwoDGuide = useMeasurementGuideStore((state) => state.completeTwoDGuide);
  const completeScoliometerGuide = useMeasurementGuideStore((state) => state.completeScoliometerGuide);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.header, { height: layout.headerHeight }]}>
        <Pressable style={styles.headerSide} hitSlop={12} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.gray[400]} />
        </Pressable>
        <Text style={styles.headerTitle}>{i18n.t("측정 가이드")}</Text>
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
          >{i18n.t("ScolioScan을 처음 사용하시는 것 같아요.")}</Text>
          <Text
            style={[
              styles.description,
              {
                fontSize: layout.descriptionFontSize,
                lineHeight: layout.descriptionLineHeight,
              },
            ]}
          >{i18n.t("원활한 측정을 위해 안내 가이드를 보시겠어요?")}</Text>
        </View>

      </View>

      <View style={[styles.bottomContent, { paddingBottom: layout.bottomOffset }]}>
        <View style={[styles.actionGroup, { width: layout.contentWidth }]}>
          <Pressable
            style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
            onPress={() => {
              // 건너뛰기는 현재 선택한 측정 방식의 가이드만 완료 처리한다.
              if (isScoliometer) {
                completeScoliometerGuide();
              } else {
                completeTwoDGuide();
              }
              router.replace(measureRoute);
            }}
          >
            <Text style={styles.skipText}>{i18n.t("이미 사용해봤어요")}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.mint[600]} />
          </Pressable>

          <View style={styles.noticeBlock}>
            <Text style={styles.noticeText}>
              {'\u2022  '}{i18n.t("‘이미 사용해봤어요’를 누르실 경우, 가이드가 다시 표시되지 않아요.")}</Text>
            <Text style={styles.noticeText}>
              {'\u2022  '}{i18n.t("가이드는 설정 - 가이드 버튼을 눌러서 언제든지 다시 보실 수 있어요.")}</Text>
          </View>
        </View>

        <View style={[styles.bottomArea, { width: layout.contentWidth }]}>
          <PrimaryButton
            title={i18n.t(guideButtonTitle)}
            onPress={() => router.push(guideRoute)}
            width="100%"
            height={layout.buttonHeight}
            backgroundColor={Colors.primary[500]}
            borderRadius={6}
            textStyle={styles.measureButtonText}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
