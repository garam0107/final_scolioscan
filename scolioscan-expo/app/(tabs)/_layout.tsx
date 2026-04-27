import { Tabs } from 'expo-router';

import BottomTabBar from '@/src/components/BottomTabBar';

export default function TabsLayout() {
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
