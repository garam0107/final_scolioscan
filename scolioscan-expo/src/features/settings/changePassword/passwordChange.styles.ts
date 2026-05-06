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
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  guideBox: {
    backgroundColor: Colors.mint[25],
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  guideText: {
    color: Colors.primary[500],
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  fieldLabel: {
    color: Colors.gray[800],
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 8,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderColor: Colors.gray[100],
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  input: {
    color: Colors.gray[800],
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    textAlignVertical : 'center',
    // paddingVertical: 0,
    paddingTop : 13,
    width: '100%',
  },
  footer: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  button: {
    width: '100%',
  },
});

export default styles;
