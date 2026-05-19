import { StyleSheet } from 'react-native';

import { textFont } from '@/src/constants/fonts';
import { Colors } from '@/src/constants/theme';

const styles = StyleSheet.create({
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
    ...textFont,
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
    ...textFont,
    color: '#F5A623',
    fontSize: 9,
    fontWeight: '700',
  },
  profileEmail: {
    ...textFont,
    color: Colors.gray[400],
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
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
  accountManagePillPressed: {
    backgroundColor: '#E6EBF1',
  },
  accountManageText: {
    ...textFont,
    color: Colors.gray[500],
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
  },
});

export default styles;
