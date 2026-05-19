import { StyleSheet } from 'react-native';

import { textFont } from '@/src/constants/fonts';
import { Colors } from '@/src/constants/theme';

const styles = StyleSheet.create({
  subscriptionCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 0.04,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  subscriptionLeft: {
    gap: 8,
  },
  subscriptionLabel: {
    ...textFont,
    color: '#454B56',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    paddingBottom: 12,
  },
  subscriptionStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  subscriptionText: {
    ...textFont,
    color: '#000000',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  linkText: {
    ...textFont,
    color: Colors.primary[500],
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
});

export default styles;
