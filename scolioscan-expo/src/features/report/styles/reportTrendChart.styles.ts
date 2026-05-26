import { StyleSheet } from 'react-native';
import { textFont } from '@/src/constants/fonts';

const styles = StyleSheet.create({
  trendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    boxShadow: '0px 0px 16px rgba(0, 0, 0, 0.04)',
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  trendSummary: {
    gap: 6,
  },
  trendTitle: {
    ...textFont,
    color: '#25272D',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  trendValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendValue: {
    ...textFont,
    color: '#25272D',
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '700',
  },
  trendBadge: {
    backgroundColor: '#EDFDFC',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendBadgeText: {
    ...textFont,
    color: '#20797E',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  trendChartWrap: {
    width: '100%',
    height: 120,
    overflow: 'hidden',
  },
  trendLegend: {
    gap: 4,
    paddingTop: 2,
  },
  trendLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  trendLegendLine: {
    width: 30,
    height: 1,
    borderStyle: 'dashed',
    borderTopWidth: 1,
  },
  trendLegendDanger: {
    borderTopColor: '#FF4B3C',
  },
  trendLegendWarning: {
    borderTopColor: '#FABE00',
  },
  trendLegendNormal: {
    borderTopColor: '#2C9696',
  },
  trendLegendText: {
    ...textFont,
    minWidth: 22,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '400',
    textAlign: 'right',
  },
  trendLegendDangerText: {
    color: '#FF4B3C',
  },
  trendLegendWarningText: {
    color: '#FABE00',
  },
  trendLegendNormalText: {
    color: '#2C9696',
  },
  trendXAxis: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendXAxisText: {
    ...textFont,
    color: '#97A2B9',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  trendEmptyState: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendEmptyText: {
    ...textFont,
    color: '#A6AFC4',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default styles;
