import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import LottieView, { type AnimationObject } from 'lottie-react-native';
import { Animated, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { Colors } from '@/src/constants/theme';
import styles, { getMeasurementGuideStepLayout } from '@/src/features/measurementGuide/shared/measurementGuideStep.styles';

type MeasurementGuideStepScreenProps = {
  pageKey: number;
  transitionDirection: 1 | -1;
  title: string;
  lottieSource?: AnimationObject;
  videoSource?: VideoSource;
  description: string;
  subDescription?: string;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
};

export default function MeasurementGuideStepScreen({
  pageKey,
  transitionDirection,
  title,
  lottieSource,
  videoSource,
  description,
  subDescription,
  nextLabel,
  onBack,
  onNext,
}: MeasurementGuideStepScreenProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const layout = getMeasurementGuideStepLayout(width, height, insets.bottom);
  const contentTranslateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 안내 페이지가 바뀔 때 책장을 넘기는 느낌이 나도록 진행 방향에 맞춰 콘텐츠만 이동시킨다.

    contentTranslateX.setValue(transitionDirection * 44);

    Animated.parallel([

      Animated.timing(contentTranslateX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentTranslateX, pageKey, transitionDirection]);
  function GuideVideo({ source }: { source: VideoSource }) {
  const player = useVideoPlayer(source, (player) => {
    // 가이드 영상은 사용자가 조작하지 않아도 반복 재생되도록 설정한다.
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <VideoView
      player={player}
      style={styles.guideVideo}
      contentFit="contain"
      nativeControls={false}
    />
  );
}
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
        <Animated.View
          style={[
            styles.animatedContent,
            {
              transform: [{ translateX: contentTranslateX }],
            },
          ]}
        >
          <Text style={styles.guideTitle}>{title}</Text>
          {/* lottie,mp4 파일 중 나중에 최종 결정하는 것으로 수정 */}
            <View style={[styles.mediaCard, { height: layout.mediaHeight }]}>
              <View style={styles.mediaClip}>
                {videoSource ? (
                  <GuideVideo source={videoSource} />
                ) : lottieSource ? (
                  <LottieView
                    source={lottieSource}
                    autoPlay
                    loop
                    resizeMode="contain"
                    style={styles.guideLottie}
                  />
                ) : null}
              </View>
            </View>
          <View style={styles.descriptionGroup}>
            <Text style={styles.description}>{description}</Text>
            {subDescription ? <Text style={styles.subDescription}>{subDescription}</Text> : null}
          </View>
        </Animated.View>
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
