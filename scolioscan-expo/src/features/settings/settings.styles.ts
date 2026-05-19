import { StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/theme';
import { textFont } from '@/src/constants/fonts';

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.gray[25],
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  timeDropdownOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  timeDropdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    maxHeight: 420,
    maxWidth: 320,
    paddingBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 16,
    width: '100%',
  },
  timeDropdownTitle: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  timeDropdownList: {
    maxHeight: 340,
  },
  timeDropdownOption: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  timeDropdownOptionSelected: {
    backgroundColor: Colors.mint[25],
  },
  timeDropdownOptionDisabled: {
    opacity: 0.35,
  },
  timeDropdownOptionText: {
    ...textFont,
    color: Colors.gray[700],
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  timeDropdownOptionTextSelected: {
    ...textFont,
    color: Colors.mint[600],
    fontWeight: '700',
  },
  timeDropdownOptionTextDisabled: {
    color: Colors.gray[400],
  },
});

export default styles;
