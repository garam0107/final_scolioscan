import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardWrap: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'flex-start',
    height: 56,
    justifyContent: 'center',
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 24,
  },
  title: {
    color: '#404552',
    fontFamily: 'PretendardVariable',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 36,
  },
  helperText: {
    color: '#7A8190',
    fontFamily: 'PretendardVariable',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  passwordRules: {
    marginTop: 10,
    gap: 8,
  },
  passwordRuleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  passwordRuleIcon: {
    marginRight: 8,
  },
  passwordRuleText: {
    color: '#8D95A3',
    fontFamily: 'PretendardVariable',
    fontSize: 13,
    lineHeight: 18,
  },
  passwordRuleTextActive: {
    color: '#2C9696',
  },
  genderWrap: {
    marginTop: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    alignItems: 'center',
    backgroundColor: '#F3F4F7',
    borderColor: '#E1E5EC',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    height: 58,
    justifyContent: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#EAF6F5',
    borderColor: '#69A9A7',
  },
  genderText: {
    color: '#7A8190',
    fontFamily: 'PretendardVariable',
    fontSize: 16,
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#4F9A97',
  },
  footer: {
    paddingBottom: 16,
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
  primaryButtonDisabled: {
    backgroundColor: '#CBD5D8',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'PretendardVariable',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.9,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    maxWidth: 320,
    paddingHorizontal: 20,
    paddingVertical: 20,
    width: '100%',
  },
  modalTitle: {
    color: '#1F2937',
    fontFamily: 'PretendardVariable',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    color: '#4B5563',
    fontFamily: 'PretendardVariable',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  modalButton: {
    alignItems: 'center',
    backgroundColor: '#5F9F9D',
    borderRadius: 6,
    height: 42,
    justifyContent: 'center',
    marginTop: 18,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontFamily: 'PretendardVariable',
    fontSize: 15,
    fontWeight: '600',
  },
});
