import { StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/theme';
import { textFont } from '@/src/constants/fonts';

export type ReportMonthSheetLayout = {
  cardPaddingHorizontal: number;
  cardPaddingTop: number;
  cardPaddingBottom: number;
  rowMarginTop: number;
  rowWidth: number;
  rowGap: number;
  rowMinHeight: number;
  sideColumnWidth: number;
  yearColumnWidth: number;
  scrollMaxHeight: number;
  scrollPaddingVertical: number;
  optionMinHeight: number;
  titleFontSize: number;
  titleLineHeight: number;
  descriptionFontSize: number;
  descriptionLineHeight: number;
  optionFontSize: number;
  optionLineHeight: number;
};

const REPORT_MONTH_SHEET_BASE_WIDTH = 360;

function roundReportLayoutValue(value: number) {
  return Math.round(value * 10) / 10;
}

export function getReportMonthSheetLayout(screenWidth: number): ReportMonthSheetLayout {
  // 피그마 360 기준 시트 비율을 화면 폭에 맞춰 제한적으로 보정한다.
  const scale = Math.min(Math.max(screenWidth / REPORT_MONTH_SHEET_BASE_WIDTH, 0.88), 1.2);

  return {
    cardPaddingHorizontal: roundReportLayoutValue(24 * scale),
    cardPaddingTop: roundReportLayoutValue(20 * scale),
    cardPaddingBottom: roundReportLayoutValue(8 * scale),
    rowMarginTop: roundReportLayoutValue(8 * scale),
    rowWidth: roundReportLayoutValue(246 * scale),
    rowGap: roundReportLayoutValue(35 * scale),
    rowMinHeight: roundReportLayoutValue(190 * scale),
    sideColumnWidth: roundReportLayoutValue(48 * scale),
    yearColumnWidth: roundReportLayoutValue(80 * scale),
    scrollMaxHeight: roundReportLayoutValue(190 * scale),
    scrollPaddingVertical: roundReportLayoutValue(7 * scale),
    optionMinHeight: roundReportLayoutValue(35 * scale),
    titleFontSize: roundReportLayoutValue(16 * scale),
    titleLineHeight: roundReportLayoutValue(22 * scale),
    descriptionFontSize: roundReportLayoutValue(10 * scale),
    descriptionLineHeight: roundReportLayoutValue(14 * scale),
    optionFontSize: roundReportLayoutValue(16 * scale),
    optionLineHeight: roundReportLayoutValue(22 * scale),
  };
}

const styles = StyleSheet.create({
  monthSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 24, 39, 0.08)',
  },
  monthSheetCard: {
    marginHorizontal: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  monthSheetTitle: {
    ...textFont,
    color: '#25272D',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  monthSheetDescription: {
    ...textFont,
    marginTop: 4,
    color: '#97A2B9',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '400',
  },
  monthPickerRow: {
    marginTop: 8,
    minHeight: 190,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 35,
  },
  monthPickerColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthPickerSideColumn: {
    width: 48,
  },
  monthPickerYearColumn: {
    width: 80,
  },
  monthPickerScrollColumn: {
    maxHeight: 190,
  },
  monthPickerScrollContent: {
    alignItems: 'center',
    paddingVertical: 7,
  },
  monthPickerOption: {
    minHeight: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthPickerOptionSelected: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D9DDE7',
  },
  monthPickerOptionText: {
    ...textFont,
    color: Colors.gray[100],
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500',
  },
  monthPickerOptionTextSelected: {
    color: Colors.gray[900],
    fontWeight: '500',
  },
  monthPickerOptionTextMuted: {
    color: Colors.gray[50],
  },
});

export default styles;
