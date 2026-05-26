import { StyleSheet } from 'react-native';

import { Colors } from '@/src/constants/theme';
import { textFont } from '@/src/constants/fonts';

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F9F9FB',
    flex: 1,
  },
  content: {
    paddingBottom: 34,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerIconButton: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  headerTitle: {
    ...textFont,
    color: '#2B2E35',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25,
  },
  headerSide: {
    height: 24,
    width: 24,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    boxShadow: '0px 0px 16px rgba(0, 0, 0, 0.04)',

  },
  professionalCard: {
    backgroundColor: '#22BCB7',
  },
  planTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  crownBadge: {
    alignItems: 'center',
    backgroundColor: '#FC9D00',
    borderRadius: 4,
    height: 24,
    justifyContent: 'center',
    marginRight: 12,
    width: 24,
  },
  planTitle: {
    ...textFont,
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  professionalText: {
    color: '#FFFFFF',
  },
  planDivider: {
    backgroundColor: '#ECECEC',
    height: 1,
    marginBottom: 16,
  },
  professionalDivider: {
    backgroundColor: '#FFFFFF',
  },
  featureList: {
    marginBottom: 16,
  },
  featureRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  lastFeatureRow: {
    marginBottom: 0,
  },
  featureText: {
    ...textFont,
    color: '#24272C',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginLeft: 7,
  },
  standardPrimaryFeatureText: {
    color: '#2B9696',
  },
  professionalFeatureText: {
    color: '#FFFFFF',
  },
  priceRow: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  priceText: {
    ...textFont,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  planButton: {
    alignItems: 'center',
    borderRadius: 6,
    justifyContent: 'center',
    minHeight: 40,
    paddingVertical: 10,
  },
  professionalButton: {
    borderColor: '#FFFFFF',
    borderWidth: 1,
  },
  disabledPlanButton: {
    backgroundColor: '#D3D8E2',
  },
  planButtonText: {
    ...textFont,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  membershipNoticeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  membershipNoticeText: {
    ...textFont,
    color: Colors.gray[600],
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21,
  },
  membershipNoticeBody: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  membershipNoticeSectionTitle: {
    ...textFont,
    color: '#5C5C5C',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 22,
  },
  membershipNoticeRefundTitle: {
    marginTop: 20,
  },
  membershipNoticeItem: {
    ...textFont,
    color: '#5C5C5C',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 2,
    paddingLeft: 10,
  },
});

export default styles;
