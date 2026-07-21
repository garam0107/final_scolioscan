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
  locked = false,
  layout,
}: MeasurementCardProps) {
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
            marginBottom: layout.iconMarginBottom,
          },
        ]}
      >
        {icon}
      </View>
      <View style={[styles.measurementCardContent, { gap: layout.contentGap }]}>
        <Text
          style={[
            styles.measurementTitle,
            {
              fontSize: layout.titleTextFontSize,
              lineHeight: layout.titleTextLineHeight,
            },
          ]}
          numberOfLines={2}
          ellipsizeMode="clip"
        >
          {title}
        </Text>
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
                lineHeight: layout.badgeTextLineHeight,
              },
              subtitleColor ? { color: subtitleColor } : null,
            ]}
            numberOfLines={2}
            ellipsizeMode="clip"
          >
            {subtitle}
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
            <Text style={styles.lockedText}>카메라로 측정하기를{`\n`}먼저 진행해주세요</Text>
          </View>
        </>
      ) : null}
    </Pressable>
  );
}
