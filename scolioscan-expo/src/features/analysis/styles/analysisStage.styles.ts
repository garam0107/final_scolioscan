import { Colors } from '@/src/constants/theme';
import { StyleSheet } from 'react-native';
import { textFont } from '@/src/constants/fonts';

const stageStyles = StyleSheet.create({
  stage: {
    backgroundColor: '#5E9E9F',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 390,
    
  },
  // 측정 때 사용한 이미지 
  stageBackgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 72, 74, 0.1)',
  },
  stageBackgroundPhoto: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    transform: [{ scale: 2.3 }],
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
  // 상부 흉추만곡, 주 흉추만곡, 요추 만곡 텍스트 스타일입니다.
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
  spineBone: {
    position: 'absolute',
    overflow: 'visible',
  },
  spineRig: {
    position: 'relative',
  },
  spineImage: {
    resizeMode: 'contain',
  },
  stage3D: {
  backgroundColor: Colors.gray[900],
},
  stage3DModelSlot: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '62%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default stageStyles;
