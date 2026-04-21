import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  headerSideButton: {
    width: 30,
    height: 30,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PretendardVariable',
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2F3A',
  },
  headerActionButton: {
    minWidth: 56,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerActionButtonDisabled: {
    opacity: 0.35,
  },
  headerActionText: {
    fontFamily: 'PretendardVariable',
    fontSize: 12,
    fontWeight: '600',
    color: '#7FAFD8',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontFamily: 'PretendardVariable',
    fontSize: 15,
    fontWeight: '500',
    color: '#A4A9B6',
  },
  listContent: {
    paddingTop: 6,
    paddingBottom: 24,
  },
  alarmItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#a0a4a8',
  },
  alarmItemLast: {
    borderBottomWidth: 0,
  },
  alarmItemUnread: {
    backgroundColor: '#EEF5FE',
  },
  alarmItemRead: {
    backgroundColor: '#FFFFFF',
  },
  alarmIconSlot: {
    width: 28,
    height: 28,
    marginRight: 10,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alarmBody: {
    flex: 1,
    minWidth: 0,
  },
  alarmTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  alarmType: {
    flex: 1,
    fontFamily: 'PretendardVariable',
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3343',
  },
  alarmDate: {
    fontFamily: 'PretendardVariable',
    fontSize: 11,
    fontWeight: '500',
    color: '#A8AFBF',
    flexShrink: 0,
  },
  alarmContent: {
    fontFamily: 'PretendardVariable',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    color: '#333B4E',
  },
  pressed: {
    opacity: 0.9,
  },
});

export default styles;
