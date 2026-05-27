import { Colors } from '@/src/constants/theme';
import { StyleSheet } from 'react-native';
import { textFont } from '@/src/constants/fonts';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.gray[25],
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  contentInset: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  measurementRequiredContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 120,
  },
  summaryTextBlock: {
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 10,
  },
  summaryNameLine: {
    ...textFont,
    color: '#1E2D30',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  summaryDiagnosisLine: {
    ...textFont,
    color: Colors.primary['black'],
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.4,
  },
  summarySeverityBold: {
    ...textFont,
    color: Colors.primary['black'],
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    ...textFont,
    marginTop: 2,
    color: '#627379',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontFamily: 'PretendardVariable',
    fontSize: 14,
    fontWeight: '500',
  },
  viewModeToggleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: 8,
  marginBottom: 16,
  paddingRight: 8,
},
viewModeLabel: {
  ...textFont,
  color: '#5E6A6D',
  fontSize: 14,
  fontWeight: '500',
},
viewModeLabelActive: {
  color: '#1E2D30',
  fontWeight: '700',
},
});

export default styles;
