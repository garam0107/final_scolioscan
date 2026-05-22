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
    width: '100%',
  },
  keyboardStickySheet: {
    width: '100%',
  },
  header: {
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  centerConfirmHeader: {
    // PDF 저장 완료 시트는 Figma처럼 제목과 설명을 가운데에 둔다.
    alignItems: 'center',
    paddingHorizontal: 0,
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
  centerConfirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
  },
  description: {
    ...textFont,
    color: Colors.gray[500],
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
    marginTop: 4,
  },
  centerConfirmDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  centerConfirmActionRow: {
    // Figma 버튼 영역의 위쪽 16px 간격을 맞춘다.
    paddingTop: 16,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: Colors.gray[50],
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  centerConfirmActionButton: {
    height: 40,
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
