import { StyleSheet } from 'react-native';

import { textFont } from '@/src/constants/fonts';
import { Colors } from '@/src/constants/theme';

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rowPressed: {
    backgroundColor: '#F7FAFB',
  },
  rowText: {
    flex: 1,
    paddingRight: 12,
  },
  rowTitle: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  rowDescription: {
    ...textFont,
    color: '#646F85',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  rowMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  rowValue: {
    ...textFont,
    color: '#96A2B9',
    fontSize: 12,
  },
  switchTrack: {
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 38,
  },
  switchThumb: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    elevation: 2,
    height: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    width: 20,
  },
  dangerText: {
    color: '#E15B58',
  },
});

export default styles;
