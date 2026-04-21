import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';

type IntroStep = {
  title: string;
  bodyLines: string[];
  image: ImageSourcePropType;
};

const INTRO_STEPS: IntroStep[] = [
  {
    title: '척추측만증이란?',
    bodyLines: [
      '척추측만증은 척추가 옆으로 휘는 질환으로,',
      '자세 불균형이나 어깨 높이 차이로 나타납니다.',
      '심하면 통증이나 호흡에 영향을 줄 수 있어',
      '조기 관리가 필요합니다.',
    ],
    image: require('../assets/images/intro1.png'),
  },
  {
    title: '스콜리오스캔은?',
    bodyLines: [
      '휴대폰으로 척추를 촬영해 AI가 분석하고,',
      '결과를 전문가에게 전달해 피드백을 받는',
      '비대면 검사 서비스입니다.',
      'X-ray 없이 안전하고 빠르게',
      '척추측만증을 확인할 수 있습니다.',
    ],
    image: require('../assets/images/intro2.png'),
  },
  {
    title: '스콜리오스캔 사용법',
    bodyLines: [
      '휴대폰으로 등을 촬영하고 자세를 맞추면,',
      'AI가 척추측만증 여부를 빠르게',
      '확인해 주는 사용법을 알려줍니다.',
    ],
    image: require('../assets/images/intro3.png'),
  },
];

export default function IntroPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const cardWidth = Math.min(width - 40, 320);

  const completeIntro = async () => {
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <IntroBackdrop />

      <View style={styles.header}>
        <Text style={styles.brand}>ScolioScan</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
        horizontal
        pagingEnabled
        bounces={false}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentStep(index);
        }}
      >
        {INTRO_STEPS.map((step, index) => {
          const isLastStep = index === INTRO_STEPS.length - 1;

          return (
            <View key={step.title} style={[styles.slide, { width }]}>
              <View style={styles.slideBody}>
                <View style={[styles.card, { width: cardWidth }]}>
                  <View style={styles.imageFrame}>
                    <Image source={step.image} style={styles.image} resizeMode="contain" />
                  </View>

                  <View style={styles.textBlock}>
                    <Text style={styles.title}>{step.title}</Text>
                    <View style={styles.bodyLines}>
                      {step.bodyLines.map((line) => (
                        <Text key={line} style={styles.bodyText}>
                          {line}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.footer}>
                <View style={styles.dots}>
                  {INTRO_STEPS.map((_, dotIndex) => (
                    <View
                      key={`dot-${dotIndex}`}
                      style={[styles.dot, currentStep === dotIndex && styles.dotActive]}
                    />
                  ))}
                </View>

                {isLastStep ? (
                  <Pressable onPress={completeIntro} style={styles.startButton}>
                    <Text style={styles.startButtonText}>시작하기</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function IntroBackdrop() {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgLinearGradient id="introBg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#D8F7F6" />
          <Stop offset="100%" stopColor="#F8FEFE" />
        </SvgLinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#introBg)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FEFE',
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 6,
  },
  brand: {
    color: '#5CB7B6',
    fontFamily: 'MuseoModerno_700Bold',
    fontSize: 26,
    letterSpacing: -0.4,
  },
  slide: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  carousel: {
    flex: 1,
  },
  carouselContent: {
    alignItems: 'stretch',
  },
  slideBody: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  card: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    shadowColor: '#7BBFBE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
  },
  imageFrame: {
    alignItems: 'center',
    backgroundColor: '#F8FCFF',
    borderRadius: 999,
    height: 186,
    justifyContent: 'center',
    marginBottom: 18,
    width: 186,
  },
  image: {
    height: 156,
    width: 156,
  },
  textBlock: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    color: '#237D82',
    fontFamily: 'PretendardVariable',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  bodyLines: {
    alignItems: 'center',
    gap: 2,
  },
  bodyText: {
    color: '#237D82',
    fontFamily: 'PretendardVariable',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    backgroundColor: '#A8D9D7',
    borderRadius: 999,
    height: 7,
    opacity: 0.55,
    width: 7,
  },
  dotActive: {
    backgroundColor: '#5FAEAE',
    opacity: 1,
    width: 18,
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: '#5FAEAE',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 24,
    width: 170,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontFamily: 'PretendardVariable',
    fontSize: 15,
    fontWeight: '700',
  },
});
