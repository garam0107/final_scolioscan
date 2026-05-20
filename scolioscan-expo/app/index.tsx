import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MIN_INDEX_VISIBLE_MS = 1500;
const COMPLETE_VISIBLE_MS = 1000;

export default function IndexPage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();
  const [progress, setProgress] = useState(0);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    const increaseProgress = () => {
      setProgress((value) => {
        if (value >= 99) return value;

        if (value < 70) {
          return Math.min(99, value + 4);
        }

        if (value < 90) {
          return Math.min(99, value + 1.5);
        }

        return Math.min(99, value + 0.2);
      });
    };

    let progressTimer: ReturnType<typeof setInterval> | undefined;
    let completeTimer: ReturnType<typeof setTimeout> | undefined;
    let routeTimer: ReturnType<typeof setTimeout> | undefined;

    if (!loading) {
      const elapsed = Date.now() - startedAt;
      const remainingTime = Math.max(0, MIN_INDEX_VISIBLE_MS - elapsed);

      // 인증 확인이 빨리 끝나도 시작 화면을 최소 시간 동안 보여줘 로딩 흐름이 갑자기 끊기지 않게 한다.
      if (remainingTime > 0) {
        progressTimer = setInterval(increaseProgress, 120);
      }

      completeTimer = setTimeout(() => {
        setProgress(100);

        // 99%에서 바로 넘어가지 않고 100% 완료 상태를 잠깐 보여준 뒤 다음 화면으로 이동한다.
        routeTimer = setTimeout(() => {
          router.replace(isAuthenticated ? '/home' : '/login');
        }, COMPLETE_VISIBLE_MS);
      }, remainingTime);

      return () => {
        if (progressTimer) clearInterval(progressTimer);
        if (completeTimer) clearTimeout(completeTimer);
        if (routeTimer) clearTimeout(routeTimer);
      };
    }

    progressTimer = setInterval(increaseProgress, 120);

    return () => {
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [loading, isAuthenticated, router, startedAt]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.brand}>ScolioScan</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <Text style={styles.progressText}>{Math.floor(progress)}%</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#22BCB7',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    color: '#F5F7FB',
    fontFamily: 'MuseoModerno_700Bold',
    fontSize: 28,
    marginBottom: 16,
  },
  spinner: {
    marginTop: 8,
  },
  progressTrack: {
    width: 180,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 247, 251, 0.35)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#F5F7FB',
  },
  progressText: {
    marginTop: 10,
    color: '#F5F7FB',
    fontFamily: 'PretendardVariable',
    fontSize: 13,
    fontWeight: '600',
  },

});
