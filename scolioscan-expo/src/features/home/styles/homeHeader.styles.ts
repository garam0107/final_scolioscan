import { StyleSheet } from 'react-native';
import { textFont } from '@/src/constants/fonts';

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    zIndex: 10,
  },
  brand: {
    color: '#22BCB7',
    fontFamily: 'MuseoModerno_700Bold',
    fontSize: 28,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontWarning: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFE8E8',
    borderWidth: 1,
    borderColor: '#F7B4B4',
  },
  fontWarningText: {
    ...textFont,
    fontSize: 12,
    fontWeight: '600',
    color: '#B13535',
  },
  greetingBlock: {
    gap: 4,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  greetingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  greetingTitle: {
    flex: 1,
    ...textFont,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#000000',
  },
  previewButtonText: {
    ...textFont,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  greetingSubtitle: {
    ...textFont,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    color: '#000000',
  },
});

export default styles;
