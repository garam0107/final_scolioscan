import { StyleSheet } from 'react-native';
import { textFont } from '@/src/constants/fonts';
import { AppleLoginButtonTokens, Colors } from '@/src/constants/theme';

const styles = StyleSheet.create({
  loadingPage: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardWrap: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: AppleLoginButtonTokens.screenVerticalPadding,
  },
  brandArea: {
    alignItems: 'center',
    width: '100%',
  },
  brandName: {
    color: Colors.mint[300],
    fontFamily: 'MuseoModerno_700Bold',
    fontSize: 27,
    letterSpacing: -0.32,
    marginBottom: 8,
    marginTop: 8,
  },
  subtitle: {
    color: '#4F5564',
    ...textFont,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
  },
  formArea: {
    marginTop: 40,
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 16,
    width: '100%',
  },
  fieldLabel: {
    color: '#000000',
    ...textFont,
    fontSize: 14,
    fontWeight: '500',
    lineHeight : 20,
    marginBottom: 10,
  },
  fieldBox: {
    backgroundColor: '#F7F7F8',
    borderColor: '#DADADC',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingLeft: 18,
    paddingRight: 12,
    width: '100%',
  },
  fieldInput: {
    color: '#292929',
    flex: 1,
    ...textFont,
    fontSize: 15,
    fontWeight: '500',
    minHeight: 56,
    paddingVertical: 0,
    width: '100%',
  },
  fieldInputWithIcon: {
    paddingRight: 8,
  },
  fieldActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  fieldIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    width: 28,
  },
  helperRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  rememberWrap: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#8AA7A6',
    borderRadius: 6,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    marginRight: 8,
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: '#5F9F9D',
    borderColor: '#5F9F9D',
  },
  rememberText: {
    color: '#000000',
    ...textFont,
    fontSize: 12,
    fontWeight : 400,
    lineHeight : 16
  },
  findPasswordText: {
    color: '#6B7280',
    ...textFont,
    fontSize: 12,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 6,
    height: 48,
    justifyContent: 'center',
    width: '100%',
  },
  primaryButtonActive: {
    backgroundColor: '#5F9F9D',
  },
  primaryButtonInactive: {
    backgroundColor: '#CBD5D8',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    ...textFont,
    fontSize: 16,
    lineHeight: 22,
  },
  dividerWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 20,
  },
  dividerLine: {
    backgroundColor: '#D5DADF',
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    color: '#9CA3AF',
    ...textFont,
    fontSize: 12,
    fontWeight: '500',
    marginHorizontal: 10,
  },
  socialRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  socialButton: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    height: 48,
    width: 48,
  },
  appleButtonWrap: {
    marginTop: AppleLoginButtonTokens.marginTop,
    width: '100%',
  },
  appleButton: {
    height: AppleLoginButtonTokens.height,
    width: '100%',
  },
  appleButtonDisabled: {
    opacity: AppleLoginButtonTokens.pressedOpacity,
  },
  signupPrompt: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupPromptText: {
    color: '#6B7280',
    ...textFont,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  signupLink: {
    color: '#5F9F9D',
    ...textFont,
    fontSize: 12,
    lineHeight: 20,
    marginLeft: 4,
  },
  findAccountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  findAccountText: {
    color: '#6B7280',
    ...textFont,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 20,
  },
  findAccountDivider: {
    color: '#94A3B8',
    ...textFont,
    fontSize: 12,
    marginHorizontal: 8,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  // 소셜 연동 시 나오는 문구 
  socialLinkGuideBox: {
  marginTop: 40,
  alignItems: 'center',
  },

  socialLinkGuideText: {
    ...textFont,
    fontWeight : 500,
    color: Colors.gray[300],
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  socialLinkGuideTextCenter: {
    ...textFont,
    fontWeight : 500,
    marginTop: 4,
    color: Colors.gray[300],
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  // 로그인 중 로딩 오버레이
  loadingOverlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(255, 255, 255, 0.72)',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
    },

    loadingBox: {
    minWidth: 150,
    minHeight: 104,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    },

    loadingText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'PretendardVariable',
    },

});

export default styles;
