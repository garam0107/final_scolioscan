import { StyleSheet } from 'react-native';

import { textFont } from '@/src/constants/fonts';
import { Colors } from '@/src/constants/theme';

const styles = StyleSheet.create({
  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
    justifyContent: 'flex-start',
    minHeight: 30,
    paddingBottom: 15,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  timeField: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  timeLabel: {
    ...textFont,
    color: '#646F85',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  timePill: {
    alignItems: 'center',
    backgroundColor: '#F2F4F6',
    borderColor: '#D3D8E2',
    borderRadius: 8,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: 10,
    width: 90,
  },
  timePillPressed: {
    backgroundColor: Colors.gray[75],
  },
  timePillText: {
    ...textFont,
    color: '#24272C',
    fontSize: 12,
    fontWeight: '400',
    includeFontPadding: false,
    lineHeight: 16,
  },
  timeSeparator: {
    ...textFont,
    color: '#646F85',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
});

export default styles;
