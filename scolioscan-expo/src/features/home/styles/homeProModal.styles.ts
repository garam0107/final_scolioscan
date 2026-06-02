import { StyleSheet } from 'react-native';
import { textFont } from '@/src/constants/fonts';

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.92,
  },
  proModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 28, 36, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  proModalCard: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 0.04,
  },
  proModalHeader: {
    height: 206,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  proModalBody: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 24,
  },
  proModalTitle: {
    ...textFont,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: '#4A8E95',
    textAlign: 'center',
  },
  proModalSubtitle: {
    marginTop: 10,
    ...textFont,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#4D5564',
    textAlign: 'center',
  },
  proModalButton: {
    marginTop: 24,
    minWidth: 118,
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#5F9F9E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proModalButtonText: {
    ...textFont,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default styles;
