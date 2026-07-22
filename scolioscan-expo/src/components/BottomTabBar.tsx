import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';
import { i18n } from '@/src/i18n';
import { Colors } from '@/src/constants/theme';
import { textFont } from '@/src/constants/fonts';

import HomeIcon from '../../assets/icons/BottomTab/home_tab.svg';
import SelectHomeIcon from '../../assets/icons/BottomTab/select_home.svg';
import AnalysisIcon from '../../assets/icons/BottomTab/search_tab.svg';
import SelectAnalysisIcon from '../../assets/icons/BottomTab/select_search.svg';
import ReportIcon from '../../assets/icons/BottomTab/report_tab.svg';
import SelectReportIcon from '../../assets/icons/BottomTab/select_report.svg';
import MoreIcon from '../../assets/icons/BottomTab/setting_tab.svg';
import SelectMoreIcon from '../../assets/icons/BottomTab/select_setting.svg';

type TabKey = 'home' | 'analysis' | 'report' | 'more';

type TabItem = {
  key: TabKey;
  labelKey: string;
  selectedIcon: React.ComponentType<SvgProps>;
  unselectedIcon: React.ComponentType<SvgProps>;
};

const TAB_ITEMS: Record<TabKey, TabItem> = {
  home: {
    key: 'home',
    labelKey: 'bottomTab.home',
    selectedIcon: SelectHomeIcon,
    unselectedIcon: HomeIcon,
  },
  analysis: {
    key: 'analysis',
    labelKey: 'bottomTab.analysis',
    selectedIcon: SelectAnalysisIcon,
    unselectedIcon: AnalysisIcon,
  },
  report: {
    key: 'report',
    labelKey: 'bottomTab.report',
    selectedIcon: SelectReportIcon,
    unselectedIcon: ReportIcon,
  },
  more: {
    key: 'more',
    labelKey: 'bottomTab.more',
    selectedIcon: SelectMoreIcon,
    unselectedIcon: MoreIcon,
  },
};

function TabIcon({
  active,
  selectedIcon: SelectedIcon,
  unselectedIcon: UnselectedIcon,
}: {
  active: boolean;
  selectedIcon: React.ComponentType<SvgProps>;
  unselectedIcon: React.ComponentType<SvgProps>;
}) {
  const Icon = active ? SelectedIcon : UnselectedIcon;

  return (
    <View style={[styles.tabContent, active ? styles.selectedTabContent : null]}>
      <Icon width={30} height={30} />
    </View>
  );
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
          // 탭 이벤트를 먼저 발행해 상위 네비게이션에서 이동을 막을 수 있게 한다.
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
          <TabIcon active={active} selectedIcon={tab.selectedIcon} unselectedIcon={tab.unselectedIcon} />
          <Text style={[styles.tabLabel, active ? styles.selectedTabLabel : null]}>
            {i18n.t(tab.labelKey)}
          </Text>
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
    width: '25%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabContent: {
    width: 78,
    height: 55,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4.5,
  },

  selectedTabContent: {
    borderWidth: 0.5,
    borderColor: 'rgba(37, 39, 45, 0.03)',
    borderRadius: 50,
    backgroundColor: 'rgba(212, 217, 226, 0.6)',
  },

  tabLabel: {
    ...textFont,
    position: 'absolute',
    // Figma의 라벨 기준점(top 42.5px, line-height 16px)에 맞춘 위치다.
    bottom: 7,
    color: 'rgba(37, 39, 45, 0.75)',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },

  selectedTabLabel: {
    color: Colors.primary[500],
  },
});

