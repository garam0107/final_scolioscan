import { i18n } from '@/src/i18n';
import { Pressable, Text, View } from 'react-native';

import styles from '@/src/features/settings/components/subscriptionCard.styles';

type SubscriptionCardProps = {
  onManagePress: () => void;
};

export default function SubscriptionCard({ onManagePress }: SubscriptionCardProps) {
  return (
    <>
      <Text style={styles.subscriptionLabel}>{i18n.t("구독 정보")}</Text>
      <View style={styles.subscriptionCard}>
        <View style={styles.subscriptionLeft}>
          <View style={styles.subscriptionStatus}>
            {/* 구독 상태에 따라 표시하도록 수정 현재는 하드코딩 */}
            <Text style={styles.subscriptionText}>{i18n.t("구독 상태에 따라 변경")}</Text>
          </View>
        </View>
        <Pressable onPress={onManagePress} hitSlop={10}>
          <Text style={styles.linkText}>{i18n.t("구독 관리")}</Text>
        </Pressable>
      </View>
    </>
  );
}
