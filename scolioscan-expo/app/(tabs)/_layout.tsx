import { useEffect, useRef } from 'react';
import { BackHandler, Platform, ToastAndroid } from 'react-native';
import { Tabs, usePathname } from 'expo-router';

import BottomTabBar from '@/src/components/BottomTabBar';

export default function TabsLayout() {
  const pathname = usePathname();
  const lastBackPressedAt = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const isHomeTab = pathname === '/home' || pathname === '/';

      if (!isHomeTab) {
        return false;
      }

      const now = Date.now();

      if (now - lastBackPressedAt.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressedAt.current = now;
      ToastAndroid.show('한 번 더 누르면 앱이 종료됩니다.', ToastAndroid.SHORT);
      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [pathname]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="analysis" />
      <Tabs.Screen name="report" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
