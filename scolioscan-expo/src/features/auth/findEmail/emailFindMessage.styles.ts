import { StyleSheet } from 'react-native';

import { Colors } from '@/src/constants/theme';

const styles = StyleSheet.create({
  page: {
    backgroundColor: Colors.gray[25],
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 80,
  },
  backButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerTitle: {
    color: Colors.gray[800],
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
  },
  headerSide: {
    width: 36,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    color: Colors.gray[700],
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 24,
  },
  footer: {
    paddingBottom: 16,
    paddingTop: 40,
  },
  primaryButton: {
    width: '100%',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
});

export default styles;
