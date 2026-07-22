import { i18n } from '@/src/i18n';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import styles from '@/src/features/settings/components/settingsSection.styles';

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
};

export default function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{i18n.t(title)}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}
