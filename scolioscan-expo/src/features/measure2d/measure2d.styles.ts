import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraStage: {
    flex: 1,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  topBar: {
    minHeight: 56,
    paddingHorizontal: 40,
    paddingTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topText: {
    color: '#fff',
    fontSize: 15,

  },
  closeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  guideCard: {
    alignSelf: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(12, 14, 18, 0.62)',
  },
  guideCardText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  guideMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideMetaText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
  },
  bottomBar: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 34,
  },
  shutterButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  shutterButtonDisabled: {
    opacity: 0.6,
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#d9d9d9',
    backgroundColor: '#fff',
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 40,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionButton: {
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  permissionButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
  outlineWrap: {
    position: 'absolute',
    pointerEvents: 'none',
  },
});
