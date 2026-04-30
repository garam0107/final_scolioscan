import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F6F7F9',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: 16,
  },
  backButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerTitle: {
    color: '#20242C',
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSide: {
    width: 36,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    color: '#5D6672',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
  },
  accountSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 14,
    elevation: 1,
  },
  fieldGroup: {
    marginBottom: 22,
  },
  fieldLabel: {
    color: '#363F4A',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: '#F0F2F6',
    borderColor: '#E1E5EB',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 14,
  },
  input: {
    color: '#7F8995',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  birthRow: {
    flexDirection: 'row',
    gap: 10,
  },
  birthInputWrap: {
    alignItems: 'center',
    backgroundColor: '#F0F2F6',
    borderColor: '#E1E5EB',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    height: 52,
    justifyContent: 'center',
  },
  birthInputText: {
    color: '#697481',
    fontSize: 13,
    fontWeight: '700',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderOption: {
    alignItems: 'center',
    backgroundColor: '#F0F2F6',
    borderColor: '#F0F2F6',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    height: 52,
    justifyContent: 'center',
  },
  genderOptionActive: {
    backgroundColor: '#F0FBFB',
    borderColor: '#5EAAA8',
  },
  genderText: {
    color: '#A1A9B3',
    fontSize: 13,
    fontWeight: '800',
  },
  genderTextActive: {
    color: '#5EAAA8',
  },
});

export default styles;
