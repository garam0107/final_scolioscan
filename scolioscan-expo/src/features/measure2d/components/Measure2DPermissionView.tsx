import { i18n } from '@/src/i18n';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '../measure2d.styles';

type Measure2DPermissionViewProps = {
  canAskAgain: boolean;
  onPress: () => void;
};

export function Measure2DPermissionView({ canAskAgain, onPress }: Measure2DPermissionViewProps) {
  return (
    <SafeAreaView style={styles.permissionScreen}>
      <View style={styles.permissionContent}>
        <Text style={styles.permissionTitle}>{i18n.t("카메라 권한이 필요합니다")}</Text>
        <Text style={styles.permissionMessage}>{i18n.t("2D 측정을 진행하려면 카메라 접근 권한을 허용해주세요.")}</Text>
        <Pressable style={styles.permissionButton} onPress={onPress}>
          <Text style={styles.permissionButtonText}>{canAskAgain ? i18n.t("권한 허용하기") : i18n.t("설정으로 이동")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
