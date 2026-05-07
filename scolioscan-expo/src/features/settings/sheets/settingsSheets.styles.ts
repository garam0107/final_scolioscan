import { StyleSheet } from 'react-native';

import { Colors } from '@/src/constants/theme';

const styles = StyleSheet.create({
  languageOptionList: {
    borderTopColor: Colors.gray[100],
    borderTopWidth: 1,
    paddingHorizontal: 8,
  },
  languageOptionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
  },
  languageOptionText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  resetDeleteBox: {
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    marginBottom: 15,
    padding: 12,
  },
  resetDeleteTitle: {
    color: Colors.gray[500],
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    marginBottom: 4,
  },
  resetDeleteItem: {
    color: Colors.gray[700],
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    paddingLeft: 19,
  },
  resetConfirmLabel: {
    color: Colors.gray[900],
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 9,
    marginLeft: 8,
  },
  resetInputWrap: {
    backgroundColor: Colors.gray[50],
    borderColor: Colors.gray[100],
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 12,
  },
  resetInput: {
    color: Colors.gray[900],
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    padding: 0,
  },
});

export default styles;
