import { StyleSheet } from 'react-native';
import { textFont } from '@/src/constants/fonts';
import { Colors } from '@/src/constants/theme';

export type MeasurementGuideStepLayout = {
  mediaHeight: number;
  contentTop: number;
  bottomOffset: number;
  scrollBottomPadding: number;
};

const FIGMA_CARD_WIDTH = 328;
const FIGMA_CARD_HEIGHT = 326;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundLayoutValue(value: number) {
  return Math.round(value * 10) / 10;
}

export function getMeasurementGuideStepLayout(
  screenWidth: number,
  screenHeight: number,
  bottomInset: number,
): MeasurementGuideStepLayout {
  const contentWidth = Math.max(0, screenWidth - 32);
  const mediaHeightByRatio = contentWidth * (FIGMA_CARD_HEIGHT / FIGMA_CARD_WIDTH);
  const mediaHeight = clamp(mediaHeightByRatio, 286, Math.min(360, screenHeight * 0.44));
  // 인트로 화면과 같은 헤더 위치를 쓰기 위해 SafeAreaView 안에서 헤더 아래 여백만 계산한다.
  const contentTop = 41;
  const bottomOffset = bottomInset + 16;

  return {
    mediaHeight: roundLayoutValue(mediaHeight),
    contentTop: roundLayoutValue(contentTop),
    bottomOffset,
    scrollBottomPadding: bottomOffset + 80,
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.gray[25],
  },
  header: {
    zIndex: 1,
    height: 64,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerSide: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...textFont,
    color: Colors.gray[800],
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  animatedContent: {
    width: '100%',
    gap: 32,
    alignItems: 'center',
  },
  guideTitle: {
    ...textFont,
    color: Colors.primary.black,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
  mediaCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: Colors.primary.white,
    shadowColor: Colors.primary.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  guideLottie :{
    width :'100%',
    height :'100%'
  },
  descriptionGroup: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  description: {
    ...textFont,
    width: '100%',
    color: Colors.gray[500],
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    textAlign: 'center',
  },
  subDescription: {
    ...textFont,
    width: '100%',
    color: Colors.gray[200],
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  bottomArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 2,
    elevation: 2,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    paddingTop: 4,
    paddingHorizontal: 16,
  },
  bottomButtonSpacer: {
    flex: 1,
    minWidth: 0,
  },
  nextButton: {
    flex: 1,
    minWidth: 0,
  },
  nextButtonText: {
    ...textFont,
    color: Colors.primary.white,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
});

export default styles;
