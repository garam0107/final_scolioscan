import { StyleSheet } from 'react-native';
import { textFont } from '@/src/constants/fonts';
import { Colors } from '@/src/constants/theme';

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: Colors.primary.white,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.primary.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    boxShadow: '0px 0px 16px rgba(0, 0, 0, 0.04)',
  },
  summaryCardActive: {
    backgroundColor: Colors.mint[25],
    borderColor: Colors.mint[300],
  },
  summaryLabel: {
    ...textFont,
    color: Colors.gray[600],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    textAlign: 'center',
  },
  summaryLabelActive: {
    color: Colors.mint[600],
  },
  summaryValue: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryValueActive: {
    color: Colors.mint[600],
  },
  trendCard: {
    backgroundColor: Colors.primary.white,
    borderRadius: 12,
    marginTop: 8,
    padding: 16,
    shadowColor: Colors.primary.black,
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
    color: Colors.gray[900],
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
    color: Colors.gray[900],
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '700',
  },
  trendBadge: {
    backgroundColor: Colors.mint[25],
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendBadgeText: {
    ...textFont,
    color: Colors.mint[600],
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
    borderTopColor: Colors.red[400],
  },
  trendLegendWarning: {
    borderTopColor: Colors.yellow[300],
  },
  trendLegendNormal: {
    borderTopColor: Colors.mint[500],
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
    color: Colors.red[400],
  },
  trendLegendWarningText: {
    color: Colors.yellow[300],
  },
  trendLegendNormalText: {
    color: Colors.mint[500],
  },
  trendXAxis: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendXAxisText: {
    ...textFont,
    color: Colors.gray[300],
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
    color: Colors.gray[300],
    fontSize: 14,
    textAlign: 'center',
  },
});

export default styles;
