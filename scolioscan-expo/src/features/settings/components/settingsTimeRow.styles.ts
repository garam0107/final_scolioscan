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
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  timeLabel: {
    ...textFont,
    color: Colors.gray[500],
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
    paddingHorizontal: 8,
    minWidth: 96,
  },
  timePillPressed: {
    backgroundColor: Colors.gray[75],
  },
  // 시간 텍스트
  timePillText: {
    ...textFont,
    color: 'red',
    fontSize: 12,
    fontWeight: '400',
    includeFontPadding: false,
    lineHeight: 16,
  },
  timeSeparator: {
    ...textFont,
    color: 'red',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  notToggleTimePill : {
    backgroundColor : Colors.gray[25],
    borderColor : Colors.gray[75]
  },
  toggleTimePill : {
    backgroundColor : Colors.gray[50],
    borderColor : Colors.gray[100]
  },
  notToggleText: {
    color : Colors.gray[100]
  },
  toggleText: {
    color : Colors.gray[900]
  },
  notToggleTimeSeparator: {
    color : Colors.gray[100]
  },
  toggleTimeSeparator: {
    color : Colors.gray[500]
  },
  notToggleTimeLabel : {
    color: Colors.gray[100]
  },
  toggleTimeLabel : {
    color: Colors.gray[500]
  },
});

export default styles;
