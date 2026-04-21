import { useMemo } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';

import SelectOffAnalysis from '../../assets/icons/select_off_analysis.svg';
import SelectOffHome from '../../assets/icons/select_off_home.svg';
import SelectOffMy from '../../assets/icons/select_off_my.svg';
import SelectOffReport from '../../assets/icons/select_off_report.svg';
import SelectOnAnalysis from '../../assets/icons/select_on_analysis.svg';
import SelectOnHome from '../../assets/icons/select_on_home.svg';
import SelectOnMy from '../../assets/icons/select_on_my.svg';
import SelectOnReport from '../../assets/icons/select_on_report.svg';

type TabKey = 'home' | 'analysis' | 'report' | 'more';

type TabItem = {
  key: TabKey;
  onPress: () => void;
  active: boolean;
  OnIcon: React.ComponentType<SvgProps>;
  OffIcon: React.ComponentType<SvgProps>;
};

function TabIcon({
  active,
  OnIcon,
  OffIcon,
}: {
  active: boolean;
  OnIcon: React.ComponentType<SvgProps>;
  OffIcon: React.ComponentType<SvgProps>;
}) {
  const Icon = active ? OnIcon : OffIcon;
  return <Icon width={56} height={56} />;
}

export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const tabs = useMemo<TabItem[]>(
    () => [
      {
        key: 'home',
        active: pathname === '/home' || pathname === '/',
        onPress: () => router.replace('/home'),
        OnIcon: SelectOnHome,
        OffIcon: SelectOffHome,
      },
      {
        key: 'analysis',
        active: pathname === '/analysis' || pathname.startsWith('/analysis/'),
        onPress: () => router.push('/analysis'),
        OnIcon: SelectOnAnalysis,
        OffIcon: SelectOffAnalysis,
      },
      {
        key: 'report',
        active: pathname === '/report',
        onPress: () => router.push('/report'),
        OnIcon: SelectOnReport,
        OffIcon: SelectOffReport,
      },
      {
        key: 'more',
        active: pathname === '/more' || pathname === '/settings' || pathname.startsWith('/profile'),
        onPress: () => router.push('/more'),
        OnIcon: SelectOnMy,
        OffIcon: SelectOffMy,
      },
    ],
    [pathname, router],
  );

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(8, insets.bottom) + 2 }]}>
      {tabs.map((tab) => (
        <Pressable key={tab.key} onPress={tab.onPress} style={styles.tab}>
          <TabIcon active={tab.active} OnIcon={tab.OnIcon} OffIcon={tab.OffIcon} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
});
