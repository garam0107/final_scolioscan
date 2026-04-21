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
    elevation: 4,
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
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  severityCardTitle: {
    color: '#2B2F36',
    fontSize: 18, // 피그마 값으로 바꾸기
    fontWeight: '600', // 피그마 값으로 바꾸기
    marginBottom: 16,
  },

  severityCardInner: {
    gap: 30,
  },

  severityRow: {
  },

  severityRowLast: {
  },

  severityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  severityLabel: {
    color: '#2B2F36',
    fontSize: 14, // 피그마 값으로 바꾸기
    fontWeight: '500', // 피그마 값으로 바꾸기
  },

  severityRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  severityValue: {
    color: '#2B2F36',
    fontSize: 14, // 피그마 값으로 바꾸기
    fontWeight: '500', // 피그마 값으로 바꾸기
    marginRight: 10,
  },

  severityBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    opacity : 100,
    shadowRadius: 20,
  },

  severityBadgeText: {
    fontSize: 12, // 피그마 값으로 바꾸기
    // fontWeight: '700', // 피그마 값으로 바꾸기
  },

  severityTrack: {
    width: '100%',
    height: 14, // 피그마 바 height로 바꾸기
    backgroundColor: '#D9DEE8',
    borderRadius: 999,
    overflow: 'hidden',
  },

  severityFill: {
    height: '100%',
    borderRadius: 999,
  },




  spineBone: {
    position: 'absolute',
    overflow: 'visible',
  },
});

// 척추 지배만곡 유형 카드 스타일
// 곡선 패탄 카드 스타일
// 의사 소견 카드 스타일

export default styles;
