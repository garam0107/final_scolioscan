import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    minHeight: 56,
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  closeText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 34,
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
