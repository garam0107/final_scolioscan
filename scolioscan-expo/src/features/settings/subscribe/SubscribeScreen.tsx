import { i18n } from '@/src/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { ScrollView as ScrollViewType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CommonSubscribeHeader from '@/src/features/settings/subscribe/components/CommonSubscribeHeader';
import CommonSubscriptionPlanCard from '@/src/features/settings/subscribe/components/CommonSubscriptionPlanCard';
import styles from '@/src/features/settings/subscribe/subscribe.styles';

const STANDARD_FEATURES = ['월 10회 측정', '주요 정보를 포함한 리포트', '내 측정 정보 7일간 보관'];
const PROFESSIONAL_FEATURES = [
  '무제한 측정',
  'AI가 분석한 각도 정보 제공',
  '보다 자세한 리포트',
  '내 측정 정보 평생 보관',
  '앱 내 광고 제거',
];
const MEMBERSHIP_NOTICE_ITEMS = [
  '결제금액은 부가세가 포함된 가격입니다',
  '등록하신 결제수단으로 매월 정기결제일에 멤버십 이용 금액이 자동으로 결제됩니다.',
  '멤버십은 언제든 해지할 수 있으며 해지해도 결제만료일까지 사용 가능합니다',
];

export default function SubscribeScreen() {
  const router = useRouter();
  const [noticeExpanded, setNoticeExpanded] = useState(false);
  const scrollViewRef = useRef<ScrollViewType | null>(null);

  const toggleNoticeExpanded = () => {
    // 유의사항을 펼칠 때 사용자가 바로 내용을 볼 수 있도록 스크롤을 하단으로 보낸다.
    setNoticeExpanded((current) => {
      const nextValue = !current;

      if (nextValue) {
        requestAnimationFrame(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        });
      }

      return nextValue;
    });
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CommonSubscribeHeader title={i18n.t("구독 관리")} onBack={() => router.back()} />

        <CommonSubscriptionPlanCard
          title={i18n.t("스탠다드")}
          features={STANDARD_FEATURES}
          buttonLabel={i18n.t("현재 이용 중")}
          disabled
        />

        <CommonSubscriptionPlanCard
          title={i18n.t("프로페셔널")}
          features={PROFESSIONAL_FEATURES}
          variant="professional"
          price={i18n.t("월 14,900원")}
          buttonLabel={i18n.t("준비중")}
          onPress={() => undefined}
        />

        <Pressable style={styles.membershipNoticeRow} onPress={toggleNoticeExpanded}>
          <Text style={styles.membershipNoticeText}>{i18n.t("멤버십 유의사항")}</Text>
          <Ionicons name={noticeExpanded ? 'chevron-up' : 'chevron-down'} size={24} color="#7E899F" />
        </Pressable>
        {noticeExpanded ? (
          <View style={styles.membershipNoticeBody}>
            <Text style={styles.membershipNoticeSectionTitle}>{i18n.t("구매안내")}</Text>
            {MEMBERSHIP_NOTICE_ITEMS.map((item) => (
              <Text key={`purchase-${item}`} style={styles.membershipNoticeItem}>
                {`• ${i18n.t(item)}`}
              </Text>
            ))}

            <Text style={[styles.membershipNoticeSectionTitle, styles.membershipNoticeRefundTitle]}>{i18n.t("환불안내")}</Text>
            {MEMBERSHIP_NOTICE_ITEMS.map((item) => (
              <Text key={`refund-${item}`} style={styles.membershipNoticeItem}>
                {`• ${i18n.t(item)}`}
              </Text>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
