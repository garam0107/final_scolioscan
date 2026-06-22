import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import styles from '@/src/features/settings/accountManage/components/accountManageComponents.styles';

type LoginMethodRowProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  badgeLabel?: string;
  actionLabel?: string;
  actionTone?: 'primary' | 'muted';
  onPressAction?: () => void;
};

export default function LoginMethodRow({
  icon,
  title,
  subtitle,
  badgeLabel,
  actionLabel,
  actionTone = 'primary',
  onPressAction,
}: LoginMethodRowProps) {
  return (
    // 소셜 로그인 행도 이메일 행과 같은 패딩 리듬을 공유해 기기별 차이를 줄인다.
    <View style={styles.loginMethodRowBox}>
      <View style={styles.infoRow}>
        <View style={styles.infoIcon}>{icon}</View>
        <View style={[styles.infoContent, actionLabel ? styles.infoContentWithRight : null]}>
          <View style={styles.infoTitleRow}>
            <Text style={styles.infoTitle}>{title}</Text>
            {badgeLabel ? (
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>{badgeLabel}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.infoSubtitle}>{subtitle}</Text>
        </View>
        {actionLabel ? (
          <Pressable disabled={!onPressAction} hitSlop={8} onPress={onPressAction}>
            <Text
              style={[
                styles.loginMethodActionText,
                actionTone === 'muted' ? styles.loginMethodActionTextMuted : null,
              ]}
            >
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
