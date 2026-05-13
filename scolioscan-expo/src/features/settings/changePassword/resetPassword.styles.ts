import { StyleSheet } from 'react-native';

import { Colors } from '@/src/constants/theme';
import baseStyles from '@/src/features/settings/changePassword/passwordChange.styles';
import { textFont } from '@/src/constants/fonts';

const styles = StyleSheet.create({
  ...baseStyles,
  passwordFieldBlock: {
    marginBottom: 16,
  },
  passwordFieldBlockCompact: {
    marginBottom: 10,
  },
  passwordInputWrap: {
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderColor: Colors.gray[100],
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 14,
  },
  passwordInput: {
    ...textFont,
    color: Colors.gray[800],
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    paddingTop: 13,
  },
  eyeButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    marginLeft: 8,
    width: 28,
  },
  ruleList: {
    gap: 4,
    marginBottom: 14,
    marginTop: -2,
    paddingHorizontal: 10,
  },
  ruleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ruleText: {
    ...textFont,
    color: '#93A0B5',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },
  ruleTextActive: {
    color: Colors.primary[500],
  },
});

export default styles;
