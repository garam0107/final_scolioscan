import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { useAuth } from '@/src/contexts/AuthContext';

export default function MorePage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await logout();
      router.replace('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>마이</Text>
        <Text style={styles.description}>계정 설정과 로그아웃을 관리할 수 있어요.</Text>

        <View style={styles.buttonStack}>
          <PrimaryButton
            title="홈으로 돌아가기"
            onPress={() => router.replace('/home')}
            width={220}
            height={50}
            backgroundColor="#5E9F9E"
          />
          <PrimaryButton
            title={loggingOut ? '로그아웃 중...' : '로그아웃'}
            onPress={handleLogout}
            width={220}
            height={50}
            backgroundColor="#D95C5C"
            disabled={loggingOut}
            style={styles.logoutButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F7F8FB',
    flex: 1,
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 96,
    paddingHorizontal: 24,
  },
  title: {
    color: '#20222D',
    fontFamily: 'PretendardVariable',
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    color: '#6B7280',
    fontFamily: 'PretendardVariable',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    textAlign: 'center',
  },
  buttonStack: {
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
  },
  logoutButton: {
    marginTop: 0,
  },
});
