import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { Colors } from '@/src/constants/theme';
import styles, { getMeasurementGuideStepLayout } from '@/src/features/measurementGuide/shared/measurementGuideStep.styles';

type MeasurementGuideStepScreenProps = {
  title: string;
  description: string;
  subDescription?: string;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
};

export default function MeasurementGuideStepScreen({
  title,
  description,
  subDescription,
  nextLabel,
  onBack,
  onNext,
}: MeasurementGuideStepScreenProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const layout = getMeasurementGuideStepLayout(width, height, insets.bottom);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.headerSide} hitSlop={12} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={Colors.gray[400]} />
        </Pressable>
        <Text style={styles.headerTitle}>측정 가이드</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: layout.contentTop,
            paddingBottom: layout.scrollBottomPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.guideTitle}>{title}</Text>
        <View style={[styles.mediaCard, { height: layout.mediaHeight }]}>
          {/* Lottie 파일만 바꾸어 2D, 3D, 척추측만계 가이드를 같은 레이아웃으로 재사용한다. */}
        </View>
        <View style={styles.descriptionGroup}>
          <Text style={styles.description}>{description}</Text>
          {subDescription ? <Text style={styles.subDescription}>{subDescription}</Text> : null}
        </View>
      </ScrollView>

      <View style={[styles.bottomArea, { bottom: layout.bottomOffset }]}>
        <View style={styles.bottomButtonSpacer} />
        <PrimaryButton
          title={nextLabel}
          onPress={onNext}
          width="100%"
          height={48}
          backgroundColor={Colors.primary[500]}
          borderRadius={6}
          textStyle={styles.nextButtonText}
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
}
