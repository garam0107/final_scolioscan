import { StyleSheet } from 'react-native';

import { Colors } from '@/src/constants/theme';
import { textFont } from '@/src/constants/fonts';

const styles = StyleSheet.create({
  page: {
    backgroundColor: Colors.gray[25],
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 16,
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
    ...textFont,
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
    justifyContent: 'center',
    paddingBottom: 154,
  },
  title: {
    ...textFont,
    color: Colors.gray[800],
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
  description: {
    ...textFont,
    color: Colors.gray[400],
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
  emailCard: {
    alignItems: 'center',
    backgroundColor: Colors.primary.white,
    borderRadius: 8,
    elevation: 0.5,
    boxShadow: "0px 0px 16px rgba(0, 0, 0, 0.04)",
    height: 114,
    justifyContent: 'center',
    marginTop: 24,
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  emailText: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  secondaryButton: {
    borderColor: Colors.gray[100],
    borderWidth: 1,
    marginTop: 24,
    width: '100%',
  },
  secondaryButtonText: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: 8,
    width: '100%',
  },
  primaryButtonText: {
    ...textFont,
    color : Colors.primary['white'],
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
});

export default styles;
