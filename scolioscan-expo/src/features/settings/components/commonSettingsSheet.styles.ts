import { StyleSheet } from 'react-native';

import { Colors } from '@/src/constants/theme';
import { textFont } from '@/src/constants/fonts';

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  keyboardStickySheet: {
    width: '100%',
  },
  header: {
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  title: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  dangerTitle: {
    color: '#FF4B3C',
  },
  description: {
    ...textFont,
    color: Colors.gray[500],
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: Colors.gray[50],
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  primaryButton: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  dangerButton: {
    backgroundColor: '#FF4B3C',
    borderColor: '#FF4B3C',
  },
  disabledButton: {
    backgroundColor: Colors.gray[100],
    borderColor: Colors.gray[100],
  },
  actionButtonText: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  filledActionButtonText: {
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: '#FFFFFF',
  },
});

export default styles;
