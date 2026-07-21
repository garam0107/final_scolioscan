import { StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/theme';
import { textFont } from '@/src/constants/fonts';

export type ReportMeasurementListLayout = {
  cardMinHeight: number;
  cardPaddingHorizontal: number;
  cardPaddingVertical: number;
  cardRadius: number;
  headerMinHeight: number;
  headerGap: number;
  headerMarginBottom: number;
  dateFontSize: number;
  dateLineHeight: number;
  measureBadgeMinWidth: number;
  measureBadgeMinHeight: number;
  measureBadgePaddingHorizontal: number;
  measureBadgePaddingVertical: number;
  measureBadgeRadius: number;
  measureBadgeTextFontSize: number;
  measureBadgeTextLineHeight: number;
  regionGap: number;
  regionRowMinHeight: number;
  regionSeparatorHeight: number;
  regionPillMinHeight: number;
  regionPillGap: number;
  regionPillPaddingHorizontal: number;
  regionPillPaddingVertical: number;
  regionLabelFontSize: number;
  regionLabelLineHeight: number;
  regionDotSize: number;
  regionDotRadius: number;
  valueGap: number;
  valueRowMarginTop: number;
  valueRowMinHeight: number;
  valueBlockWidth: number;
  valueLabelFontSize: number;
  valueLabelLineHeight: number;
  valueFontSize: number;
  valueLineHeight: number;
};

const REPORT_BASE_SCREEN_WIDTH = 360;
const REPORT_LARGE_BASE_SCREEN_WIDTH = 400;
const REPORT_SCREEN_HORIZONTAL_PADDING = 16;
const REPORT_MEASUREMENT_SEPARATOR_TOTAL_WIDTH = 2;

function roundReportLayoutValue(value: number) {
  return Math.round(value * 10) / 10;
}

function getReportMeasurementListScale(screenWidth: number) {
  // 일반 폰에서는 현재 피그마 기준 수치를 유지하고, 작은/큰 폰에서만 목록 카드 비율을 보정한다.
  if (screenWidth < REPORT_BASE_SCREEN_WIDTH) {
    return Math.max(0.88, screenWidth / REPORT_BASE_SCREEN_WIDTH);
  }

  if (screenWidth > REPORT_LARGE_BASE_SCREEN_WIDTH) {
    return Math.min(1.08, screenWidth / REPORT_LARGE_BASE_SCREEN_WIDTH);
  }

  return 1;
}

export function getReportMeasurementListLayout(screenWidth: number): ReportMeasurementListLayout {
  const scale = getReportMeasurementListScale(screenWidth);
  const cardPaddingHorizontal = roundReportLayoutValue(20 * scale);
  const regionGap = roundReportLayoutValue(10 * scale);
  const cardInnerWidth = Math.max(
    0,
    screenWidth - REPORT_SCREEN_HORIZONTAL_PADDING * 2 - cardPaddingHorizontal * 2,
  );
  const regionWidth = (cardInnerWidth - REPORT_MEASUREMENT_SEPARATOR_TOTAL_WIDTH - regionGap * 4) / 3;
  const valueGap = Math.max(0, Math.min(16 * scale, regionWidth - 66 * scale));

  return {
    cardMinHeight: roundReportLayoutValue(138 * scale),
    cardPaddingHorizontal,
    cardPaddingVertical: roundReportLayoutValue(16 * scale),
    cardRadius: roundReportLayoutValue(12 * scale),
    headerMinHeight: roundReportLayoutValue(22 * scale),
    headerGap: roundReportLayoutValue(12 * scale),
    headerMarginBottom: roundReportLayoutValue(20 * scale),
    dateFontSize: roundReportLayoutValue(14 * scale),
    dateLineHeight: roundReportLayoutValue(20 * scale),
    measureBadgeMinWidth: roundReportLayoutValue(51 * scale),
    measureBadgeMinHeight: roundReportLayoutValue(22 * scale),
    measureBadgePaddingHorizontal: roundReportLayoutValue(8 * scale),
    measureBadgePaddingVertical: roundReportLayoutValue(4 * scale),
    measureBadgeRadius: roundReportLayoutValue(5 * scale),
    measureBadgeTextFontSize: roundReportLayoutValue(10 * scale),
    measureBadgeTextLineHeight: roundReportLayoutValue(14 * scale),
    regionGap,
    regionRowMinHeight: roundReportLayoutValue(64 * scale),
    regionSeparatorHeight: roundReportLayoutValue(56 * scale),
    regionPillMinHeight: roundReportLayoutValue(18 * scale),
    regionPillGap: roundReportLayoutValue(10 * scale),
    regionPillPaddingHorizontal: roundReportLayoutValue(8 * scale),
    regionPillPaddingVertical: roundReportLayoutValue(2 * scale),
    regionLabelFontSize: roundReportLayoutValue(10 * scale),
    regionLabelLineHeight: roundReportLayoutValue(14 * scale),
    regionDotSize: roundReportLayoutValue(6 * scale),
    regionDotRadius: roundReportLayoutValue(3 * scale),
    valueGap: roundReportLayoutValue(valueGap),
    valueRowMarginTop: roundReportLayoutValue(8 * scale),
    valueRowMinHeight: roundReportLayoutValue(42 * scale),
    valueBlockWidth: roundReportLayoutValue(38 * scale),
    valueLabelFontSize: roundReportLayoutValue(10 * scale),
    valueLabelLineHeight: roundReportLayoutValue(14 * scale),
    valueFontSize: roundReportLayoutValue(18 * scale),
    valueLineHeight: roundReportLayoutValue(24 * scale),
  };
}

const styles = StyleSheet.create({
  section: {
    marginTop: 18,
  },
  sectionHeader: {
    minHeight: 34,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    ...textFont,
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  monthSelectButton: {
    minWidth: 78,
    height: 34,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary['white'],
    borderWidth: 1,
    borderColor: Colors.gray[50],
    borderRadius: 17,
  },
  monthSelectText: {
    ...textFont,
    color: '#000000',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  tabsWrap: {
    position: 'relative',
    marginBottom: 14,
    paddingBottom: 10,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tabDivider: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: '#D9DDE7',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  tabText: {
    ...textFont,
    color: '#111827',
    fontSize: 15,
  },
  tabIndicator: {
    position: 'absolute',
    left: 0,
    bottom: -1,
    height: 2,
    backgroundColor: Colors.primary['500'],
    borderRadius: 99,
  },
  loadingBox: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listArea: {
    marginBottom: 4,
  },
  listAreaEmpty: {
    minHeight: 120,
  },
  listScrollContent: {
    paddingBottom: 0,
  },
  list: {
    gap: 16,
  },
  measurementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minHeight: 138,
    paddingHorizontal: 20,
    paddingVertical: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    boxShadow: '0px 0px 16px rgba(0, 0, 0, 0.04)',
  },
  measurementCardHeader: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  measurementDate: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  measurementBadge: {
    minWidth: 51,
    minHeight: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EDFDFC',
    borderRadius: 5,
  },
  measurementBadgeText: {
    ...textFont,
    color: '#20797E',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
  },
  measurementRegionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 10,
    minHeight: 64,
  },
  measurementRegion: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
  measurementRegionSeparator: {
    width: 1,
    height: 56,
    backgroundColor: '#D9DDE7',
  },
  measurementRegionPill: {
    alignSelf: 'center',
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
  },
  measurementRegionLabel: {
    ...textFont,
    color: '#25272D',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '400',
  },
  measurementRegionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  measurementValueRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 42,
  },
  measurementValueRowWide: {
    // 태블릿에서는 카드 폭만 넓어지고 값 묶음은 모바일과 같은 간격으로 보이도록 제한한다.
    width: 106,
    alignSelf: 'center',
  },
  measurementValueRowSingle: {
    justifyContent: 'center',
  },
  measurementValueBlock: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 38,
    flexShrink: 0,
  },
  measurementValueLabel: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '400',
  },
  measurementCurvatureValue: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    includeFontPadding: false,
    textAlign: 'center',
    width: '100%',
  },
  measurementRotationValue: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    includeFontPadding: false,
    textAlign: 'center',
    width: '100%',
  },
  emptyBox: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...textFont,
    color: '#20222D',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    ...textFont,
    color: Colors.gray[300],
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 400,
    lineHeight : 20,
    marginTop: 8,
  },
  pressed: {
    opacity: 0.72,
  },
});

export default styles;
