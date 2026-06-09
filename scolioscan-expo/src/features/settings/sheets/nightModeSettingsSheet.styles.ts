import { StyleSheet } from 'react-native';
import { textFont } from '@/src/constants/fonts';
import { Colors } from '@/src/constants/theme';

export type NightModeSheetLayout = {
  contentWidth: number;
  cardPaddingTop: number;
  cardPaddingBottom: number;
  sectionPaddingHorizontal: number;
  sectionPaddingVertical: number;
  columnGap: number;
  titleWidth: number;
  pickerWidth: number;
  pickerHeight: number;
  optionHeight: number;
  scrollPaddingVertical: number;
  titleFontSize: number;
  optionFontSize: number;
  optionLineHeight: number;
};

const BASE_WIDTH = 360;
const BASE_CONTENT_WIDTH = 328;

function roundLayout(value: number) {
  return Math.round(value * 10) / 10;
}

export function getNightModeSheetLayout(screenWidth: number): NightModeSheetLayout {
  const scale = Math.min(Math.max(screenWidth / BASE_WIDTH, 0.88), 1.08);

  const contentWidth = roundLayout(BASE_CONTENT_WIDTH * scale);
  const sectionPaddingHorizontal = roundLayout(24 * scale);

  const titleWidth = roundLayout(40 * scale);
  const pickerWidth = roundLayout(35 * scale);

  const innerWidth = contentWidth - sectionPaddingHorizontal * 2;
  const columnsWidth = titleWidth + pickerWidth * 3;
  const columnGap = roundLayout((innerWidth - columnsWidth) / 3);

  return {
    contentWidth,
    cardPaddingTop: 0,
    cardPaddingBottom: 0,

    sectionPaddingHorizontal,
    sectionPaddingVertical: roundLayout(14 * scale),
    columnGap,

    titleWidth,
    pickerWidth,
    pickerHeight: roundLayout(84 * scale),
    optionHeight: roundLayout(28 * scale),
    scrollPaddingVertical: roundLayout(28 * scale),

    titleFontSize: roundLayout(15 * scale),
    optionFontSize: roundLayout(15 * scale),
    optionLineHeight: roundLayout(20 * scale),
  };
}

const styles = StyleSheet.create({
  sheetCard: {
    alignItems: 'center',
  },

  section: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#D4D9E2',
  },

  sectionTitle: {
    ...textFont,
    color: '#000000',
    fontWeight: '500',
    textAlign: 'left',
  },

  ampmContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  ampmOption: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  ampmOptionSelected: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D9DDE7',
  },

  ampmText: {
    ...textFont,
    fontWeight: '500',
    color: Colors.gray[50],
  },

  ampmTextSelected: {
    color: '#000000',
  },

  pickerColumn: {
    overflow: 'hidden',
  },

  scrollContent: {},

  option: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionSelected: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D9DDE7',
  },

  optionText: {
    ...textFont,
    color: Colors.gray[50],
    fontWeight: '500',
  },

  optionTextSelected: {
    color: '#25272D',
  },
});

export default styles;