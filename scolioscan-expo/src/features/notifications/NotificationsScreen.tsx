import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { alarmAPI } from '@/src/api/alarm';
import type { AlarmResponse } from '@/src/types/alarm';
import {
  AlarmMeasurementBadge,
  AlarmOtherBadge,
  AlarmShoppingBadge,
} from '@/src/features/notifications/notificationIcons';
import styles from '@/src/features/notifications/notifications.styles';

function formatListDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

function getAlarmMeta(alarmType: number) {
  switch (alarmType) {
    case 2:
      return { label: '측정', Icon: AlarmMeasurementBadge };
    case 4:
      return { label: '쇼핑', Icon: AlarmShoppingBadge };
    case 1:
    case 3:
    default:
      return { label: '기타', Icon: AlarmOtherBadge };
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [alarms, setAlarms] = useState<AlarmResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // 유저의 알림 읽어오는 함수
  const loadAlarms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await alarmAPI.getAlarms();
      // 읽지 않은 알림만 가져오기
      setAlarms(response.data.filter((alarm) => alarm.read_at == null));
    } catch (error) {
      console.error('Failed to load alarms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAlarms();
    }, [loadAlarms]),
  );

  const handleBack = () => {
    router.back();
  };
  // 모두 읽음 누르면 페이지에서 표시 안되도록 하는 함수
  const handleMarkAllAsRead = async () => {
  if (alarms.length === 0) {
    return;
  }

  try {
    await alarmAPI.markAllAsRead();
    setAlarms([]);
  } catch (error) {
    console.error('Failed to mark all alarms as read:', error);
  }
};
  // 개별 알림 클릭 시 페이지에 표시 안되도록 하는 함수
  const handleAlarmPress = async (alarm: AlarmResponse) => {
  if (alarm.read_at) {
    return;
  }

  try {
    await alarmAPI.markAsRead(alarm.id);
    setAlarms((current) => current.filter((item) => item.id !== alarm.id));
  } catch (error) {
    console.error('Failed to mark alarm as read:', error);
  }
};


  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={[styles.page, { paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={12} style={styles.headerSideButton}>
            <Ionicons name="chevron-back" size={26} color="#A4A9B6" />
          </Pressable>
          <Text style={styles.headerTitle}>알림</Text>
          <Pressable
            onPress={handleMarkAllAsRead}
            disabled={alarms.length === 0}
            hitSlop={10}
            style={({ pressed }) => [
              styles.headerActionButton,
              alarms.length === 0 && styles.headerActionButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.headerActionText}>모두읽음</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyText}>알림을 불러오는 중이에요</Text>
          </View>
        ) : alarms.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons name="notifications-off-outline" size={56} color="#CBD2E1" />
            <Text style={styles.emptyText}>아직 알림이 없어요</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {alarms.map((alarm, index) => {
              const unread = alarm.read_at == null;
              const meta = getAlarmMeta(alarm.alarm_type);
              const AlarmIcon = meta.Icon;

              return (
                <View key={alarm.id}>
                  <Pressable
                    onPress={() => void handleAlarmPress(alarm)}
                    style={({ pressed }) => [
                      styles.alarmItem,
                      unread ? styles.alarmItemUnread : styles.alarmItemRead,
                      index === alarms.length - 1 && styles.alarmItemLast,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.alarmIconSlot}>
                      <AlarmIcon />
                    </View>
                    <View style={styles.alarmBody}>
                      <View style={styles.alarmTopRow}>
                        <Text style={styles.alarmType}>{meta.label}</Text>
                        <Text style={styles.alarmDate}>{formatListDate(alarm.created_at)}</Text>
                      </View>
                      <Text style={styles.alarmContent} numberOfLines={2}>
                        {alarm.content}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
