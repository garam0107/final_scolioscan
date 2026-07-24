import { StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/theme';
import { textFont } from '@/src/constants/fonts';

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.92,
  },
  measurementCard: {
    height: '100%',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    boxShadow: '0px 0px 16px rgba(0, 0, 0, 0.04)',
  },
  lockedCard: {
    backgroundColor: Colors.gray[75],
  },
  lockedBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    overflow: 'hidden',
  },
  lockedContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 10,
  },
  lockedArrowWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedText: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
  measurementCardContent: {
    width: '100%',
    minWidth: 0,
    flexShrink: 1,
    alignItems: 'center',
    gap: 6,
  },
  measurementTitle: {
    ...textFont,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#25272D',
    textAlign: 'center',
  },
  measurementRemainingText: {
    ...textFont,
    fontSize: 10,
    lineHeight: 20,
    fontWeight: '500',
    color: Colors.gray[500],
    textAlign: 'center',
  },
  measurementTitleGroup: {
    alignItems: 'center',
  },
  proBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 100,
    backgroundColor: '#FFF4A3',
    zIndex: 1,
  },
  proBadgeText: {
    ...textFont,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: '#DA981C',
  },
  measurementBadge: {
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EDFDFC',
    overflow: 'hidden',
  },
  measurementBadgeText: {
    ...textFont,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.mint[600],
    textAlign: 'center',
  },
  measurementIconWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 15,
  },
});

export default styles;
