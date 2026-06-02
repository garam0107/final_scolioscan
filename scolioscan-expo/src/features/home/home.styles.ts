import { StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/theme';
import { textFont } from '@/src/constants/fonts';

export type HomeMeasurementCardLayout = {
  cardWidth: number;
  cardHeight: number;
  cardPadding: number;
  cardRadius: number;
  proBadgeLeft: number;
  proBadgeTop: number;
  proBadgeHeight: number;
  proBadgeGap: number;
  proBadgePaddingHorizontal: number;
  proBadgeIconSize: number;
  proBadgeTextFontSize: number;
  proBadgeTextLineHeight: number;
  iconSize: number;
  iconMarginBottom: number;
  contentGap: number;
  titleTextFontSize: number;
  titleTextLineHeight: number;
  badgePaddingHorizontal: number;
  badgePaddingVertical: number;
  badgeRadius: number;
  badgeTextFontSize: number;
  badgeTextLineHeight: number;
};

const HOME_MEASUREMENT_HORIZONTAL_PADDING = 20;
const HOME_MEASUREMENT_CARD_GAP = 8;
const HOME_MEASUREMENT_REFERENCE_SCREEN_WIDTH = 383;
const HOME_MEASUREMENT_REFERENCE_CARD_WIDTH =
  (HOME_MEASUREMENT_REFERENCE_SCREEN_WIDTH - HOME_MEASUREMENT_HORIZONTAL_PADDING * 2 - HOME_MEASUREMENT_CARD_GAP) / 2;

function roundLayoutValue(value: number) {
  return Math.round(value * 10) / 10;
}

export function getHomeMeasurementCardLayout(screenWidth: number): HomeMeasurementCardLayout {
  const cardWidth = (screenWidth - HOME_MEASUREMENT_HORIZONTAL_PADDING * 2 - HOME_MEASUREMENT_CARD_GAP) / 2;
  // 수정 전 갤럭시 S20+에서 보이던 카드 비율을 기준으로 모든 내부 요소를 같은 배율로 맞춘다.
  const spaceScale = Math.min(Math.max(cardWidth / HOME_MEASUREMENT_REFERENCE_CARD_WIDTH, 0.8), 1.16);
  const cardPadding = roundLayoutValue(12 * spaceScale);
  const badgePaddingHorizontal = roundLayoutValue(8 * spaceScale);
  const badgeTextFontSize = roundLayoutValue(13 * spaceScale);

  return {
    cardWidth,
    cardHeight: roundLayoutValue(180 * spaceScale),
    cardPadding,
    cardRadius: roundLayoutValue(12 * spaceScale),
    proBadgeLeft: roundLayoutValue(12 * spaceScale),
    proBadgeTop: roundLayoutValue(12 * spaceScale),
    proBadgeHeight: roundLayoutValue(18 * spaceScale),
    proBadgeGap: roundLayoutValue(4 * spaceScale),
    proBadgePaddingHorizontal: roundLayoutValue(6 * spaceScale),
    proBadgeIconSize: roundLayoutValue(10 * spaceScale),
    proBadgeTextFontSize: roundLayoutValue(12 * spaceScale),
    proBadgeTextLineHeight: roundLayoutValue(16 * spaceScale),
    iconSize: roundLayoutValue(60 * spaceScale),
    iconMarginBottom: roundLayoutValue(15 * spaceScale),
    contentGap: roundLayoutValue(6 * spaceScale),
    titleTextFontSize: roundLayoutValue(14 * spaceScale),
    titleTextLineHeight: roundLayoutValue(20 * spaceScale),
    badgePaddingHorizontal,
    badgePaddingVertical: roundLayoutValue(4 * spaceScale),
    badgeRadius: roundLayoutValue(6 * spaceScale),
    badgeTextFontSize,
    badgeTextLineHeight: roundLayoutValue(badgeTextFontSize * (18 / 13)),
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.gray[25],
  },
  page: {
    flex: 1,
    backgroundColor: Colors.gray[25],
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.primary.white,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...textFont,
    fontSize: 15,
    fontWeight: '500',
    color: '#47777D',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionHeading: {
    ...textFont,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: 14,
  },
  weeklySection: {
    marginTop: 16,
  },
  contentSlot: {
    height: 20,
  },
});

export default styles;
