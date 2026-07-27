import { StyleSheet } from 'react-native';
import { textFont } from '@/src/constants/fonts';

const styles = StyleSheet.create({
  bannerWrap: {
    width: '100%',
    marginTop: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    boxShadow: '0px 0px 16px rgba(0, 0, 0, 0.04)',
  },
  bannerPager: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  banner: {
    height: 112,
    overflow: 'hidden',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerPlaceholderText: {
    ...textFont,
    color: '#2C9696',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default styles;
