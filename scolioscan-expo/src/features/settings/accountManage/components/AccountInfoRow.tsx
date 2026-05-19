import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import styles from '@/src/features/settings/accountManage/components/accountManageComponents.styles';

type AccountInfoRowProps = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  badgeLabel?: string;
  rightElement?: ReactNode;
  variant?: 'login' | 'device';
};

export default function AccountInfoRow({
  icon,
  title,
  subtitle,
  badgeLabel,
  rightElement,
  variant = 'login',
}: AccountInfoRowProps) {
  return (
    <View style={styles.infoRow}>
      {icon ? <View style={styles.infoIcon}>{icon}</View> : null}
      <View style={[styles.infoContent, rightElement ? styles.infoContentWithRight : null]}>
        <View style={styles.infoTitleRow}>
          <Text style={[styles.infoTitle, variant === 'device' ? styles.infoTitleDevice : null]}>{title}</Text>
          {badgeLabel ? (
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeText}>{badgeLabel}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text style={[styles.infoSubtitle, variant === 'device' ? styles.infoSubtitleDevice : null]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightElement}
    </View>
  );
}
