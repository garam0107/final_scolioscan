import { StyleSheet } from 'react-native';
import { textFont } from '@/src/constants/fonts';

export const agreementStyles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  titleBlock: {
    gap: 14,
    marginBottom: 60,
  },
  title: {
    color: '#3B4049',
    ...textFont,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 38,
  },
  subtitle: {
    color: '#657085',
    ...textFont,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  list: {
    gap: 8,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 48,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  rowMain: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 14,
  },
  allRow: {
    backgroundColor: '#FFFFFF',
    borderColor: '#7AD7D4',
    borderRadius: 6,
    borderWidth: 1,
    gap: 14,
    justifyContent: 'flex-start',
  },
  allRowChecked: {
    backgroundColor: '#EDFDFC',
  },
  checkIcon: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  allLabel: {
    color: '#000000',
    ...textFont,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  itemLabel: {
    color: '#25272D',
    ...textFont,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  moreLink: {
    color: '#97A2B9',
    ...textFont,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    textDecorationLine: 'underline',
  },
  modalRoot: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#EEF0F4',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  modalTitle: {
    color: '#3B4049',
    flex: 1,
    ...textFont,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 16,
  },
  modalBody: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalFooter: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  modalAgreeButtonText: {
    // 약관 상세 화면의 하단 고정 버튼 문구를 시안 크기에 맞춥니다.
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  modalText: {
    color: '#3B4049',
    ...textFont,
    fontSize: 14,
    lineHeight: 22,
  },
});
