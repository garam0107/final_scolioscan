import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F7',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  summaryTextBlock: {
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 10,
  },
  summaryNameLine: {
    color: '#1E2D30',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  summaryDiagnosisLine: {
    color: '#627379',
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: -0.4,
  },
  summarySeverityBold: {
    color: '#627379',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
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
  overlayLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '600',
    letterSpacing: -0.6,
    textShadowColor: 'rgba(0, 0, 0, 0.14)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  digitFrame: {
    width: 28,
    height: 34,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitWheel: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  digitCell: {
    width: 26,
    height: 26,
    lineHeight: 26,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontVariant: ['tabular-nums'],
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  degree: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    paddingLeft: 1,
    paddingBottom: 4,
  },
  errorText: {
    marginTop: 10,
    color: '#B04545',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
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
    color: '#2B2F36',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 16,
  },
  infoCardBody: {
    color: '#6E7783',
    fontSize: 11,
    lineHeight: 18,
    fontWeight: '500',
  },
  infoCardLink: {
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
    color: '#8A949A',
    fontSize: 12,
    fontWeight: '500',
  },

  severityValue: {
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingLeft: 20,
    paddingRight: 0,
    paddingTop: 22,
    paddingBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 200,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 0.04,
  },

  dominantCurveText: {
    flex: 1,
    paddingRight: 8,
  },

  dominantCurveTitle: {
    color: '#1E2D30',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 24,
  },

  dominantCurveBody: {
    color: '#8A949A',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },

  dominantCurveDiagnosis: {
    color: '#1E2D30',
    fontWeight: '700',
  },

  dominantCurveLink: {
    marginTop: 22,
    color: '#A9B2BE',
    fontSize: 11,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },

  dominantCurveImageWrap: {
    width: 140,
    height: 180,
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  spineBone: {
    position: 'absolute',
    overflow: 'visible',
  },
});

export default styles;
