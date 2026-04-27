import { useMemo } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';

// import SelectOffAnalysis from '../../assets/icons/select_off_analysis.svg';
// import SelectOffHome from '../../assets/icons/select_off_home.svg';
// import SelectOffMy from '../../assets/icons/select_off_my.svg';
// import SelectOffReport from '../../assets/icons/select_off_report.svg';
// import SelectOnAnalysis from '../../assets/icons/select_on_analysis.svg';
// import SelectOnHome from '../../assets/icons/select_on_home.svg';
// import SelectOnMy from '../../assets/icons/select_on_my.svg';
// import SelectOnReport from '../../assets/icons/select_on_report.svg';

// 새로운 바텀 탭 아이콘
import NewSelectOffHome from '../../assets/icons/BottomTab/new_home_2.svg'
import NewSelectOffAnalysis from '../../assets/icons/BottomTab/new_analysis_2.svg'
import NewSelectOffReport from '../../assets/icons/BottomTab/new_report_2.svg'
import NewSelcetOffSetting from '../../assets/icons/BottomTab/new_setting_2.svg'
import NewSelectOnHome from '../../assets/icons/BottomTab/new_home_1.svg'
import NewSelectOnAnalysis from '../../assets/icons/BottomTab/new_analysis_1.svg'
import NewSelectOnReport from '../../assets/icons/BottomTab/new_report_1.svg'
import NewSelcetOnSetting from '../../assets/icons/BottomTab/new_setting_1.svg'

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
  return <Icon width={80} height={60} />;
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
        OnIcon: NewSelectOnHome,
        OffIcon: NewSelectOffHome,
      },
      {
        key: 'analysis',
        active: pathname === '/analysis' || pathname.startsWith('/analysis/'),
        onPress: () => router.push('/analysis'),
        OnIcon: NewSelectOnAnalysis,
        OffIcon: NewSelectOffAnalysis,
      },
      {
        key: 'report',
        active: pathname === '/report',
        onPress: () => router.push('/report'),
        OnIcon: NewSelectOnReport,
        OffIcon: NewSelectOffReport,
      },
      {
        key: 'more',
        active: pathname === '/more' || pathname === '/settings' || pathname.startsWith('/profile'),
        onPress: () => router.push('/more'),
        OnIcon: NewSelcetOnSetting,
        OffIcon: NewSelcetOffSetting,
      },
    ],
    [pathname, router],
  );

  return (
    <View style={styles.wrap}>
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
  height: 60,
  marginHorizontal: 10,
  marginBottom: 10,
  backgroundColor: '#FFFFFF',
  borderRadius: 50,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  shadowColor: '#000000',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 12,
},

  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
});
