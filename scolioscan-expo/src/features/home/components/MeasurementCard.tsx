import { i18n } from '@/src/i18n';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import ArrowLeftIcon from '../../../../assets/home/arrow_left.svg';
import type { HomeMeasurementCardLayout } from '@/src/features/home/home.styles';
import styles from '@/src/features/home/styles/measurementCard.styles';

export type MeasurementItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress?: () => void;
  pro?: boolean;
  subtitleColor?: string;
  subtitleBackgroundColor?: string;
  subtitleLineBreakAfter?: string;
  remainingText?: string;
  locked?: boolean;
};

type MeasurementCardProps = MeasurementItem & {
  layout: HomeMeasurementCardLayout;
};

export default function MeasurementCard({
  title,
  subtitle,
  icon,
  onPress,
  pro,
  subtitleColor,
  subtitleBackgroundColor,
  subtitleLineBreakAfter,
  remainingText,
  locked = false,
  layout,
}: MeasurementCardProps) {
  const useCompactText = i18n.language !== 'ko';
  const contentGap = remainingText
    ? layout.contentGap
    : useCompactText
      ? Math.max(3, layout.contentGap * 0.5)
      : layout.contentGap;
  const titleLineHeight = useCompactText ? Math.min(18, layout.titleTextLineHeight) : layout.titleTextLineHeight;
  const badgeLineHeight = useCompactText ? Math.min(16, layout.badgeTextLineHeight) : layout.badgeTextLineHeight;
  const iconMarginBottom = useCompactText ? Math.min(8, layout.iconMarginBottom) : layout.iconMarginBottom;
  const translatedSubtitle = i18n.t(subtitle);
  // 한국어 라벨은 화면 너비와 관계없이 지정된 위치에서 두 줄로 표시한다.
  const displaySubtitle =
    i18n.language.startsWith('ko') && subtitleLineBreakAfter
      ? translatedSubtitle.replace(
          `${subtitleLineBreakAfter} `,
          `${subtitleLineBreakAfter}\n`,
        )
      : translatedSubtitle;
  const titleContent = (
    <Text
      style={[
        styles.measurementTitle,
        {
          fontSize: layout.titleTextFontSize,
          lineHeight: titleLineHeight,
        },
      ]}
      numberOfLines={2}
      adjustsFontSizeToFit
      minimumFontScale={0.78}
      ellipsizeMode="clip"
    >
      {i18n.t(title)}
    </Text>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      style={({ pressed }) => [
        styles.measurementCard,
        {
          width: layout.cardWidth,
          height: layout.cardHeight,
          padding: layout.cardPadding,
          borderRadius: layout.cardRadius,
        },
        locked && styles.lockedCard,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.measurementIconWrap,
          {
            width: layout.iconSize,
            height: layout.iconSize,
            marginBottom: iconMarginBottom,
          },
        ]}
      >
        {icon}
      </View>
      <View style={[styles.measurementCardContent, { gap: contentGap }]}>
        <View style={styles.measurementTitleGroup}>
          {/* 횟수 문구가 없어도 동일한 한 줄 높이를 유지해 두 카드의 아이콘 위치를 맞춘다. */}
          <Text style={styles.measurementRemainingText}>{remainingText ?? ' '}</Text>
          {titleContent}
        </View>
        <View
          style={[
            styles.measurementBadge,
            {
              paddingHorizontal: layout.badgePaddingHorizontal,
              paddingVertical: layout.badgePaddingVertical,
              borderRadius: layout.badgeRadius,
            },
            subtitleBackgroundColor ? { backgroundColor: subtitleBackgroundColor } : null,
          ]}
        >
          <Text
            style={[
              styles.measurementBadgeText,
              {
                fontSize: layout.badgeTextFontSize,
                lineHeight: badgeLineHeight,
              },
              subtitleColor ? { color: subtitleColor } : null,
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            ellipsizeMode="clip"
          >
            {displaySubtitle}
          </Text>
        </View>
      </View>
      {locked ? (
        <>
          {/* 피그마의 16px 콘텐츠 블러를 네이티브 블러 반경으로 맞춘다. */}
          <BlurView
            intensity={64}
            blurReductionFactor={4}
            experimentalBlurMethod="dimezisBlurView"
            style={styles.lockedBlur}
            pointerEvents="none"
          />
          <View style={styles.lockedContent} pointerEvents="none">
            <View style={styles.lockedArrowWrap}>
              <ArrowLeftIcon width={64} height={54} />
            </View>
            <Text style={styles.lockedText}>{i18n.t("카메라로 측정하기를")}{`\n`}{i18n.t("먼저 진행해주세요")}</Text>
          </View>
        </>
      ) : null}
    </Pressable>
  );
}
