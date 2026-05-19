import { Colors } from '@/src/constants/theme';
import { StyleSheet } from 'react-native';
import { textFont } from '@/src/constants/fonts';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
      backgroundColor: Colors.gray[25],
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
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
  stage: {
    backgroundColor: '#5E9E9F',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 390,
  },
  spineLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arcMarker: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arcMarkerCenter: {
    backgroundColor: '#FFFFFF',
  },
  textLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  metric: {
    position: 'absolute',
    zIndex: 10,
  },
  metricLeft: {
    alignItems: 'flex-start',
  },
  metricRight: {
    alignItems: 'flex-end',
  },
  // 상부 흉추만곡, 주 흉추만곡, 요추 만곡 텍스트 스타일
  metricLabel: {
    ...textFont,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'nowrap',
  },
  // 각도 텍스트 스타일
  metricValue: {
    ...textFont,
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '600',
    letterSpacing: -0.6,
    textShadowColor: 'rgba(0, 0, 0, 0.14)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  metricValueSlot: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  digitFrame: {
    width: 24,
    height: 38,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  digitWheel: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  digitCell: {
    ...textFont,
    width: 24,
    height: 38,
    lineHeight: 38,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontVariant: ['tabular-nums'],
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '600',
    letterSpacing: -0.6,
    textShadowColor: 'rgba(0, 0, 0, 0.14)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  degree: {
    ...textFont,
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    marginLeft: 1,
    paddingBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.14)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  errorText: {
    ...textFont,
    marginTop: 10,
    color: '#B04545',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    ...textFont,
    marginTop: 10,
    color: '#65767B',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    alignSelf: 'center',
    marginTop: 10,
    backgroundColor: '#5E9E9F',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    ...textFont,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  // 분기별 척추측만증 정보 카드 스타일
  infoCard: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    minHeight: 136,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 0.04,
  },
  infoCardText: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 12,
  },
  infoCardTitle: {
    ...textFont,
    color: '#2B2F36',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 16,
  },
  infoCardBody: {
    ...textFont,
    color: '#6E7783',
    fontSize: 11,
    lineHeight: 18,
    fontWeight: '500',
  },
  infoCardLink: {
    ...textFont,
    marginTop: 18,
    color: '#A9B2BE',
    fontSize: 11,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  infoCardImageWrap: {
    width: 120,
    height: 140,
    flexShrink: 0,
    marginLeft: 'auto',
    marginRight: -14,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  // 심각도 분석 카드 스타일
  severityCard: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 0.04,
  },

  severityCardTitle: {
    ...textFont,
    color: '#1E2D30',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 22,
  },

  severityCardInner: {
    gap: 18,
  },

  severityRow: {
    gap: 10,
  },

  severityRegionLabel: {
    ...textFont,
    color: '#2B2F36',
    fontSize: 14,
    fontWeight: '600',
  },

  severityValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  severityCurvatureLabel: {
    ...textFont,
    color: '#8A949A',
    fontSize: 12,
    fontWeight: '500',
  },

  severityValue: {
    ...textFont,
    color: '#1E2D30',
    fontSize: 16,
    fontWeight: '700',
  },

  severityBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  severityBadgeText: {
    ...textFont,
    fontSize: 11,
    fontWeight: '600',
  },

  severityBarWrap: {
    flex: 1,
    marginLeft: 4,
  },

  severityTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },

  severityFill: {
    height: '100%',
    borderRadius: 999,
  },

  severityDivider: {
    marginTop: 18,
    height: 1,
    backgroundColor: '#EEF1F3',
  },

  // 척추 지배만곡 유형 카드 스타일
  dominantCurveCard: {
    marginTop: 14,
    backgroundColor: '#2C9696',
    borderRadius: 18,
    minHeight: 136,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 0.04,
  },

  dominantCurveText: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 12,
  },

  dominantCurveTitle: {
    ...textFont,
    color: Colors.primary['white'],
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 22,
  },

  dominantCurveBody: {
    ...textFont,
    color: Colors.gray[25],
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
  },

  dominantCurveDiagnosis: {
    ...textFont,
    color: Colors.primary['white'],
    fontWeight: '500',
  },

  dominantCurveLink: {
    ...textFont,
    marginTop: 22,
    color: Colors.gray[25],
    fontSize: 10,
    fontWeight: '400',
    lineHeight : 14,
    textDecorationLine: 'underline',
  },

  dominantCurveImageWrap: {
    width: 120,
    height: 140,
    flexShrink: 0,
    marginLeft: 'auto',
    marginRight: -14,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  curvePatternCard: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 0.04,
  },

  curvePatternTitle: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 16,
    fontWeight: '600',
    lineHeight : 22,
    marginBottom: 16,
  },

  curvePatternContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  curvePatternIconBox: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  curvePatternBarSmall: {
    width: 3,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#22BCB7',
  },

  curvePatternBarMedium: {
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#22BCB7',
  },

  curvePatternBarLarge: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#22BCB7',
  },

  curvePatternText: {
    flex: 1,
    gap: 4,
  },

  curvePatternName: {
    ...textFont,
    color: Colors.primary[500],
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },

  curvePatternBody: {
    ...textFont,
    color: Colors.gray[500],
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
  },

  aiDoctorSvgWrap: {
    marginTop: 0,
    marginHorizontal: -20,
    aspectRatio: 360 / 667,
  },

  spineBone: {
    position: 'absolute',
    overflow: 'visible',
  },
  loadingBox : {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  },
  loadingText : {
      color: '#6B7280',
  fontFamily: 'PretendardVariable',
  fontSize: 14,
  fontWeight: '500',
  }
});

export default styles;
