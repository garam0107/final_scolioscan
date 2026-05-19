import { StyleSheet } from 'react-native';

import { textFont } from '@/src/constants/fonts';
import { Colors } from '@/src/constants/theme';

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.gray[25],
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: Colors.gray[25],
    flexDirection: 'row',
    height: 80,
    paddingHorizontal: 16,
  },
  backButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerTitle: {
    ...textFont,
    color: '#20242C',
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSide: {
    width: 36,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    ...textFont,
    color: '#000000',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 12,
  },
});

export default styles;
