import { i18n } from '@/src/i18n';
import { Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import styles from '../styles/analysisCards.styles';
// 구독 상품 재개 시 아래 잠금 카드 주석을 해제하고 함께 복구한다.
// import PrimaryButton from '@/src/components/ui/PrimaryButton';
// import { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
// import LoadingChartIcon from '../../../../assets/icons/home/loading_chart.svg';
// import LoadingSearchIcon from '../../../../assets/icons/home/loading_search.svg';

const BASE_SECTION_WIDTH = 328;
const BASE_SECTION_HEIGHT = 635;
const SCREEN_HORIZONTAL_PADDING = 32;
// const BASE_LOCK_CARD_WIDTH = 264;
// const BASE_LOCK_CARD_HEIGHT = 456;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function AiDoctorCard() {
  const { width } = useWindowDimensions();
  const availableCardWidth = width - SCREEN_HORIZONTAL_PADDING;
  const sectionScale = clamp(availableCardWidth / BASE_SECTION_WIDTH, 0.8, 1.08);
  const sectionHeight = Math.round(BASE_SECTION_HEIGHT * sectionScale);
  // 구독 상품 재개 시 잠금 카드 주석과 함께 아래 크기 계산도 복구한다.
  // const cardWidth = Math.round(BASE_LOCK_CARD_WIDTH * sectionScale);
  // const cardHeight = Math.round(BASE_LOCK_CARD_HEIGHT * sectionScale);
  // const visualWidth = 180 * sectionScale;
  // const visualHeight = 220 * sectionScale;
  // const chartSize = 120 * sectionScale;
  // const searchSize = 115 * sectionScale;

  // 구독 상품 재개 시 아래 잠금 오버레이와 구독 카드 주석을 해제한다.
  return (
    <View style={[styles.aiDoctorSection, { height: sectionHeight }]}>
      <View style={styles.aiDoctorLockedContent}>
        <Text style={styles.aiDoctorLockedTitle}>{i18n.t("ScolioScan 추천")}</Text>

        <View style={styles.aiDoctorRiskRow}>
          <View style={styles.aiDoctorRiskIconBox}>
            <Svg width={18} height={18} viewBox="0 0 18 18">
              <Path
                d="M9 14.2C5.9 11.5 4 9.8 4 7.3C4 5.8 5.2 4.6 6.7 4.6C7.6 4.6 8.4 5 9 5.7C9.6 5 10.4 4.6 11.3 4.6C12.8 4.6 14 5.8 14 7.3C14 9.8 12.1 11.5 9 14.2Z"
                fill="none"
                stroke="#FAD342"
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View>
            <Text style={styles.aiDoctorRiskLabel}>{i18n.t("위험도 평가")}</Text>
            <Text style={styles.aiDoctorRiskValue}>{i18n.t("보통")}</Text>
          </View>
        </View>

        <View style={styles.aiDoctorDivider} />
        <Text style={styles.aiDoctorSectionLabel}>{i18n.t("예후")}</Text>
        <Text style={styles.aiDoctorBodyText}>{i18n.t("적절한 관찰과 생활 습관 관리가 필요해요.")}</Text>

        <View style={styles.aiDoctorDivider} />
        <Text style={styles.aiDoctorSectionLabel}>{i18n.t("보조기 권장 사항")}</Text>
        <Text style={styles.aiDoctorBodyText}>{i18n.t("전문의 상담을 통해 보조기 착용 여부를 확인해요.")}</Text>

        <View style={styles.aiDoctorDivider} />
        <Text style={styles.aiDoctorSectionLabel}>{i18n.t("자세 및 인체 공학")}</Text>
        <Text style={styles.aiDoctorBodyText}>{i18n.t("바른 자세와 규칙적인 스트레칭을 유지해 주세요.")}</Text>
      </View>

      {/* 구독 상품이 없으므로 현재는 추천 내용을 모든 사용자에게 그대로 표시한다.
      <Svg pointerEvents="none" style={styles.aiDoctorGradient} width="100%" height="100%">
        <Defs>
          <LinearGradient id="aiDoctorLockGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="0.21" stopColor="#D4D9E2" stopOpacity="0.52" />
            <Stop offset="0.4" stopColor="#E3E7ED" stopOpacity="0.98" />
            <Stop offset="0.56" stopColor="#D4D9E2" stopOpacity="0.97" />
            <Stop offset="0.69" stopColor="#D4D9E2" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#aiDoctorLockGradient)" />
      </Svg>

      <View
        style={[
          styles.aiDoctorSubscribeCard,
          {
            width: cardWidth,
            height: cardHeight,
            bottom: 64 * sectionScale,
            paddingHorizontal: 20 * sectionScale,
            paddingVertical: 24 * sectionScale,
            gap: 32 * sectionScale,
          },
        ]}
      >
        <View style={[styles.aiDoctorVisual, { width: visualWidth, height: visualHeight }]}>
          <View
            style={[
              styles.aiDoctorChartIcon,
              {
                left: (visualWidth - chartSize) / 2,
                top: (visualHeight - chartSize) / 2,
                width: chartSize,
                height: chartSize,
              },
            ]}
          >
            <LoadingChartIcon width={chartSize} height={chartSize} />
          </View>
          <View
            style={[
              styles.aiDoctorSearchIcon,
              {
                left: 65 * sectionScale,
                top: 82 * sectionScale,
                width: searchSize,
                height: searchSize,
              },
            ]}
          >
            <LoadingSearchIcon width={searchSize} height={searchSize} />
          </View>
        </View>

        <View
          style={[
            styles.aiDoctorSubscribeTextBlock,
            // 긴 번역문은 아이콘과 버튼 위치를 유지한 채 텍스트 영역만 위로 올린다.
            i18n.language !== 'ko' ? { transform: [{ translateY: -16 * sectionScale }] } : null,
          ]}
        >
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            style={styles.aiDoctorSubscribeTitle}
          >
            {i18n.t("ScolioScan 추천을 보려면 구독해야해요")}
          </Text>
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            style={styles.aiDoctorSubscribeDescription}
          >
            {i18n.t("처음 구독하시면 50% 할인해드려요!")}
          </Text>
        </View>

        <View style={[styles.aiDoctorSubscribeButtonPosition, { bottom: 24 * sectionScale }]}>
          <PrimaryButton
            title={i18n.t("구독하러 가기")}
            onPress={handleSubscribePress}
            width={105}
            height={40}
            backgroundColor="#2C9696"
            borderRadius={6}
            textStyle={styles.aiDoctorSubscribeButtonText}
          />
        </View>
      </View>
      */}
    </View>
  );
}
