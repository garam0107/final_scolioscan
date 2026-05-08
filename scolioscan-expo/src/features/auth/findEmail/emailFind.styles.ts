import { StyleSheet } from 'react-native';

import { Colors } from '@/src/constants/theme';

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.gray[25],
    flex: 1,
  },
  header: {
    alignItems: 'center',
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
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 14,
  },
  guideBoxWrap: {
    marginBottom: 24,
  },
  footer: {
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  button: {
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
});

export default styles;
