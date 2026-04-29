import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F6F7F9',
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  profileCard: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 68,
    paddingHorizontal: 2,
    paddingVertical: 10,
  },
  avatar: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  profileText: {
    flex: 1,
    marginLeft: 12,
  },
  nameLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  profileName: {
    color: '#20242C',
    fontSize: 14,
    fontWeight: '700',
  },
  proBadge: {
    backgroundColor: '#FFF4DC',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  proBadgeText: {
    color: '#F5A623',
    fontSize: 9,
    fontWeight: '700',
  },
    profileEmail: {
    color: '#99A2AE',
    fontSize: 10,
    marginTop: 3,
  },
  accountManagePill: {
    alignItems: 'center',
    backgroundColor: '#F1F3F6',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 2,
    marginLeft: 12,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  accountManageText: {
    color: '#9AA3AE',
    fontSize: 11,
    fontWeight: '600',
  },
  subscriptionTitle: {
    color: '#222832',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  subscriptionCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 14,
    elevation: 1,
  },
  subscriptionLeft: {
    gap: 8,
  },
  subscriptionLabel: {
    color: '#454B56',
    fontSize: 14,
    fontWeight: '400',
    paddingBottom : 12,
    lineHeight : 20,
  },
  subscriptionStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  subscriptionText: {
    color: '#2F3741',
    fontSize: 12,
    fontWeight: '700',
  },
  linkText: {
    color: '#5E9F9E',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    color: '#222832',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 12,
    lineHeight : 20,
  },
  sectionBody: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 14,
    elevation: 1,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  rowPressed: {
    backgroundColor: '#F7FAFB',
  },
  rowText: {
    flex: 1,
    paddingRight: 12,
  },
  rowTitle: {
    color: '#25272D',
    fontSize: 13,
    fontWeight: '500',
  },
  rowDescription: {
    color: '#657085',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  rowMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  rowValue: {
    color: '#9AA3AE',
    fontSize: 11,
  },
  dangerText: {
    color: '#E15B58',
  },
  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 38,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timeLabel: {
    color: '#7F8A96',
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
  },
  timePills: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  timePill: {
    alignItems: 'center',
    backgroundColor: '#F0F3F6',
    borderRadius: 10,
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timePillText: {
    color: '#6C7682',
    fontSize: 10,
    fontWeight: '600',
  },
  timeSeparator: {
    color: '#AAB2BC',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default styles;
