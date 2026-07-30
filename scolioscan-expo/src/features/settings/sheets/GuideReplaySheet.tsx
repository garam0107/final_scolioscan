import { i18n } from '@/src/i18n';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import CommonSettingsSheet from '@/src/features/settings/components/CommonSettingsSheet';
import styles from '@/src/features/settings/sheets/settingsSheets.styles';

type GuideReplaySheetProps = {
  visible: boolean;
  onClose: () => void;
};

const GUIDE_OPTIONS = [
  // 3D 스캔 가이드는 이후 연결할 예정이라 현재 다시보기 시트에서는 노출하지 않는다.
  {
    label: '카메라 측정하기',
    route: '/measure/guide-2d-camera?mode=replay',
  },
  {
    label: '정교한 측정하기',
    route: '/measure/guide-spine?mode=replay',
  },
] as const;

export default function GuideReplaySheet({ visible, onClose }: GuideReplaySheetProps) {
  const router = useRouter();

  const handleSelectGuide = (route: (typeof GUIDE_OPTIONS)[number]['route']) => {
    onClose();
    router.push(route);
  };

  return (
    <CommonSettingsSheet
      visible={visible}
      title={i18n.t("가이드 다시보기")}
      description={i18n.t("다시 보고 싶으신 가이드를 눌러주세요")}
      onClose={onClose}
      bottomPlacement="safeArea"
    >
      <View style={styles.languageOptionList}>
        {GUIDE_OPTIONS.map((option) => (
          <Pressable
            key={option.route}
            style={({ pressed }) => [styles.guideOptionRow, pressed && styles.guideOptionRowPressed]}
            onPress={() => handleSelectGuide(option.route)}
          >
            <Text style={styles.languageOptionText}>{i18n.t(option.label)}</Text>
          </Pressable>
        ))}
      </View>
    </CommonSettingsSheet>
  );
}
