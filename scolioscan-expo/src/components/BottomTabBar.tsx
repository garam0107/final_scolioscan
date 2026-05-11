import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
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
  OnIcon: React.ComponentType<SvgProps>;
  OffIcon: React.ComponentType<SvgProps>;
};

const TAB_ITEMS: Record<TabKey, TabItem> = {
  home: {
    key: 'home',
    OnIcon: NewSelectOnHome,
    OffIcon: NewSelectOffHome,
  },
  analysis: {
    key: 'analysis',
    OnIcon: NewSelectOnAnalysis,
    OffIcon: NewSelectOffAnalysis,
  },
  report: {
    key: 'report',
    OnIcon: NewSelectOnReport,
    OffIcon: NewSelectOffReport,
  },
  more: {
    key: 'more',
    OnIcon: NewSelcetOnSetting,
    OffIcon: NewSelcetOffSetting,
  },
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

export default function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
  <View style={[styles.container, { paddingBottom: insets.bottom + 10 }]}>
    <View style={styles.wrap}>
      {state.routes.map((route, index) => {
        const tab = TAB_ITEMS[route.name as TabKey];
        if (!tab) return null;

        const active = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (event.defaultPrevented) {
            return;
          }

          if (!active) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
        <Pressable key={route.key} onPress={onPress} style={styles.tab}>
          <TabIcon active={active} OnIcon={tab.OnIcon} OffIcon={tab.OffIcon} />
        </Pressable>
        );
      })}
    </View>
  </View>
);
 

}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    backgroundColor: '#F7F8FB',
  },

  wrap: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: 'white',
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

