import { StyleSheet } from 'react-native';

import { textFont } from '@/src/constants/fonts';

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    ...textFont,
    color: '#000000',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionBody: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 0.04,
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    boxShadow: '0px 0px 16px rgba(0, 0, 0, 0.04)',
  },
});

export default styles;
