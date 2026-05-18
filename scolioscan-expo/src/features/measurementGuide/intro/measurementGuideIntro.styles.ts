import { StyleSheet } from 'react-native';
import { textFont } from '@/src/constants/fonts';
import { Colors } from '@/src/constants/theme';

export type MeasurementGuideIntroLayout = {
  contentWidth: number;
  titleWidth: number;
  headerHeight: number;
  heroTop: number;
  actionTop: number;
  bottomOffset: number;
  titleFontSize: number;
  titleLineHeight: number;
  descriptionFontSize: number;
  descriptionLineHeight: number;
  buttonHeight: number;
};

const FIGMA_BASE_WIDTH = 360;
const FIGMA_ACTION_TOP = 334;
const FIGMA_HEADER_HEIGHT = 64;
const FIGMA_CONTENT_HORIZONTAL_PADDING = 16;
const FIGMA_TITLE_WIDTH = 320;
const ACTION_GROUP_RESERVED_HEIGHT = 310;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundLayoutValue(value: number) {
  return Math.round(value * 10) / 10;
}

export function getMeasurementGuideIntroLayout(
  screenWidth: number,
  screenHeight: number,
  bottomInset: number,
): MeasurementGuideIntroLayout {
  // 피그마 360 기준을 따르되 버튼은 컨테이너 전체 폭을 쓰고 세로 간격은 기준값을 유지한다.
  const widthScale = clamp(screenWidth / FIGMA_BASE_WIDTH, 0.9, 1.06);
  const contentWidth = Math.max(0, roundLayoutValue(screenWidth - FIGMA_CONTENT_HORIZONTAL_PADDING * 2));
  const titleWidth = Math.min(roundLayoutValue(FIGMA_TITLE_WIDTH * widthScale), contentWidth);
  const headerHeight = FIGMA_HEADER_HEIGHT;
  const bottomOffset = bottomInset + 16;
  const bottomButtonTop = screenHeight - bottomOffset - 48;
  const preferredHeroTop = 16;
  const preferredActionTop = FIGMA_ACTION_TOP - headerHeight;
  const maxActionTop = bottomButtonTop - ACTION_GROUP_RESERVED_HEIGHT;
  const actionTop = clamp(preferredActionTop, preferredHeroTop + 116, maxActionTop);

  return {
    contentWidth,
    titleWidth,
    headerHeight: roundLayoutValue(headerHeight),
    heroTop: roundLayoutValue(preferredHeroTop),
    actionTop: roundLayoutValue(actionTop),
    bottomOffset,
    titleFontSize: roundLayoutValue(28 * clamp(widthScale, 0.96, 1.04)),
    titleLineHeight: roundLayoutValue(38 * clamp(widthScale, 0.96, 1.04)),
    descriptionFontSize: 16,
    descriptionLineHeight: 22,
    buttonHeight: 48,
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.gray[25],
  },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 20,
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    position: 'relative',
  },
  heroTextBlock: {
    position: 'absolute',
    gap: 14,
    alignItems: 'flex-start',
  },
  title: {
    ...textFont,
    maxWidth: '100%',
    color: Colors.gray[700],
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '700',
  },
  description: {
    ...textFont,
    color: Colors.gray[500],
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  actionGroup: {
    position: 'absolute',
    alignItems: 'center',
    gap: 16,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  outlineButtonText: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  completedGuideButton : {
    borderWidth: 1,
    borderColor: Colors.mint[300],
  },
  completedGuideButtonText : {
        ...textFont,
    color: Colors.mint[600],
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  skipButton: {
    marginTop: 2,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  skipText: {
    ...textFont,
    color: Colors.mint[600],
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  noticeBlock: {
    width: '100%',
    marginTop: 2,
    paddingVertical: 12,
    gap: 4,
  },
  noticeText: {
    ...textFont,
    color: Colors.gray[300],
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
  },
  bottomArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'stretch',
    paddingHorizontal: 16,
  },
  measureButtonText: {
    ...textFont,
    color: Colors.primary.white,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.72,
  },
});

export default styles;
