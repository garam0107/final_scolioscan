import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { ScrollView as ScrollViewType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CommonSubscribeHeader from '@/src/features/settings/subscribe/components/CommonSubscribeHeader';
import CommonSubscriptionPlanCard from '@/src/features/settings/subscribe/components/CommonSubscriptionPlanCard';
import styles from '@/src/features/settings/subscribe/subscribe.styles';

const STANDARD_FEATURES = ['월 10회 2D 촬영', '주요 정보를 포함한 리포트', '내 측정 정보 7일간 보관'];
const PROFESSIONAL_FEATURES = [
  '무제한 2D, 3D 촬영',
  '보다 자세한 리포트',
  '내 측정 정보 평생 보관',
  '가까운 병원 후속 진료 예약',
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
        <CommonSubscribeHeader title="구독 관리" onBack={() => router.back()} />

        <CommonSubscriptionPlanCard
          title="스탠다드"
          features={STANDARD_FEATURES}
          buttonLabel="현재 이용 중"
          disabled
        />

        <CommonSubscriptionPlanCard
          title="프로페셔널"
          features={PROFESSIONAL_FEATURES}
          variant="professional"
          price="월 14,900원"
          buttonLabel="준비중"
          onPress={() => undefined}
        />

        <Pressable style={styles.membershipNoticeRow} onPress={toggleNoticeExpanded}>
          <Text style={styles.membershipNoticeText}>멤버십 유의사항</Text>
          <Ionicons name={noticeExpanded ? 'chevron-up' : 'chevron-down'} size={24} color="#7E899F" />
        </Pressable>
        {noticeExpanded ? (
          <View style={styles.membershipNoticeBody}>
            <Text style={styles.membershipNoticeSectionTitle}>구매안내</Text>
            {MEMBERSHIP_NOTICE_ITEMS.map((item) => (
              <Text key={`purchase-${item}`} style={styles.membershipNoticeItem}>
                {`• ${item}`}
              </Text>
            ))}

            <Text style={[styles.membershipNoticeSectionTitle, styles.membershipNoticeRefundTitle]}>환불안내</Text>
            {MEMBERSHIP_NOTICE_ITEMS.map((item) => (
              <Text key={`refund-${item}`} style={styles.membershipNoticeItem}>
                {`• ${item}`}
              </Text>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
