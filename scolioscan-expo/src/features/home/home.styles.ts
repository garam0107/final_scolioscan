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
    backgroundColor: '#F9FAFB',
  },
  page: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  header: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    zIndex: 10,
  },
  brand: {
    color: '#22BCB7',
    fontFamily: 'MuseoModerno_700Bold',
    fontSize: 28,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fontWarning: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFE8E8',
    borderWidth: 1,
    borderColor: '#F7B4B4',
  },
  fontWarningText: {
    ...textFont,
    fontSize: 12,
    fontWeight: '600',
    color: '#B13535',
  },
  headerIconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EA4B57',
    borderWidth: 1.5,
    borderColor: '#F7F8FB',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  greetingBlock: {
    gap: 4,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  greetingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  greetingTitle: {
    flex: 1,
    ...textFont,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#000000',
  },
  previewButtonText: {
    ...textFont,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  greetingSubtitle: {
    ...textFont,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    color: '#000000',
  },
  sectionHeading: {
    ...textFont,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: 14,
  },
  measurementGrid: {
    flexDirection: 'row',
    gap: 8,
    height : 180
  },
  pressed: {
    opacity: 0.92,
  },
  measurementCard: {
    height: '100%',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 0.04,
  },
  measurementCardContent: {
    width: '100%',
    minWidth: 0,
    alignItems: 'center',
    gap: 6,
  },
  measurementTitle: {
    ...textFont,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#25272D',
    textAlign: 'center',
  },
  proBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 100,
    backgroundColor: '#FFF4A3',
    zIndex: 1,
  },
  proBadgeText: {
    ...textFont,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: '#DA981C',
  },
  measurementBadge: {
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EDFDFC',
    overflow: 'hidden',
  },
  measurementBadgeText: {
    ...textFont,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.mint[600],
    textAlign: 'center',
  },
  measurementIconWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 15,
  },
  proModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 28, 36, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  proModalCard: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 0.04,
  },
  proModalHeader: {
    height: 206,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  proModalBody: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 24,
  },
  proModalTitle: {
    ...textFont,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: '#4A8E95',
    textAlign: 'center',
  },
  proModalSubtitle: {
    marginTop: 10,
    ...textFont,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#4D5564',
    textAlign: 'center',
  },
  proModalButton: {
    marginTop: 24,
    minWidth: 118,
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#5F9F9E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proModalButtonText: {
    ...textFont,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  infoCard: {
    flex: 1,
  },
  infoCardImageWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#DFF4F4',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardImage: {
    width: '80%',
    height: '80%',
  },
  infoTitle: {
    marginTop: 10,
    ...textFont,
    fontSize: 14,
    fontWeight: '700',
    color: '#30343D',
  },
  infoSubtitle: {
    marginTop: 2,
    ...textFont,
    fontSize: 12,
    fontWeight: '500',
    color: '#6FAAB5',
  },
  bannerWrap: {
    width: '100%',
    marginTop : 16,
  },
  bannerPager: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerSlide: {
    overflow: 'hidden',
  },
  banner: {
    height: 112,
    overflow: 'hidden',
    backgroundColor: '#EAF7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImage: {
  },
  bannerPlaceholderText: {
    ...textFont,
    color: '#2C9696',
    fontSize: 18,
    fontWeight: '700',
  },
  bannerBadge: {
    position: 'absolute',
    right: 11,
    bottom: 9,
    backgroundColor: 'rgba(44, 150, 150, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  bannerBadgeText: {
    ...textFont,
    fontSize: 10,
    fontWeight: '500',
    color: '#2C9696',
  },
  weeklySection: {
    marginTop: 16,
  },
  weeklyResultGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  weeklyResultCard: {
    flex: 1,
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0.04,
  },
  weeklyResultCardActive: {
    backgroundColor: '#EDFDFC',
    borderColor: '#7AD7D4',
  },
  weeklyResultLabel: {
    ...textFont,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: '#515968',
    textAlign: 'center',
  },
  weeklyResultLabelActive: {
    color: '#20797E',
  },
  weeklyResultValue: {
    ...textFont,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#25272D',
  },
  weeklyResultValueActive: {
    color: '#20797E',
  },
  trendCard: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 0.04,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  trendSummary: {
    gap: 6,
  },
  trendCaption: {
    ...textFont,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.gray[900],
  },
  trendValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendAverageValue: {
    ...textFont,
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '700',
    color: Colors.gray[900],
  },
  trendChangeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: Colors.mint[25],
  },
  trendChangeText: {
    ...textFont,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    color: Colors.mint[600],
  },
  trendLegend: {
    gap: 4,
    paddingTop: 2,
  },
  trendLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  trendLegendLine: {
    width: 30,
    height: 1,
    borderStyle: 'dashed',
    borderTopWidth: 1,
  },
  trendLegendDanger: {
    borderTopColor: '#FF4B3C',
  },
  trendLegendWarning: {
    borderTopColor: '#FABE00',
  },
  trendLegendNormal: {
    borderTopColor: Colors.mint[500],
  },
  trendLegendText: {
    minWidth: 22,
    ...textFont,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '400',
    textAlign: 'right',
  },
  trendLegendDangerText: {
    color: '#FF4B3C',
  },
  trendLegendWarningText: {
    color: '#FABE00',
  },
  trendLegendNormalText: {
    color: Colors.mint[500],
  },
  trendChartWrap: {
    width: '100%',
    height: 120,
    overflow: 'hidden',
  },
  trendXAxis: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendXAxisText: {
    ...textFont,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: Colors.gray[300],
  },
  contentSlot: {
    height: 20,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 18,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  bottomTabLabel: {
    ...textFont,
    fontSize: 11,
    fontWeight: '500',
    color: '#B7BECC',
  },
  bottomTabLabelActive: {
    color: '#5E9F9E',
  },
});

export default styles;
