import React from 'react';
import { Pressable, Text, View } from 'react-native';
import CrownIcon from '../../../../assets/home/crown.svg';
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
  layout,
}: MeasurementCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.measurementCard,
        {
          width: layout.cardWidth,
          height: layout.cardHeight,
          padding: layout.cardPadding,
          borderRadius: layout.cardRadius,
        },
        pressed && styles.pressed,
      ]}
    >
      {pro && (
        <View
          style={[
            styles.proBadge,
            {
              left: layout.proBadgeLeft,
              top: layout.proBadgeTop,
              height: layout.proBadgeHeight,
              gap: layout.proBadgeGap,
              paddingHorizontal: layout.proBadgePaddingHorizontal,
            },
          ]}
        >
          <CrownIcon width={layout.proBadgeIconSize} height={layout.proBadgeIconSize} />
          <Text
            style={[
              styles.proBadgeText,
              {
                fontSize: layout.proBadgeTextFontSize,
                lineHeight: layout.proBadgeTextLineHeight,
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="clip"
          >
            Pro
          </Text>
        </View>
      )}
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
          numberOfLines={1}
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
            numberOfLines={1}
            ellipsizeMode="clip"
          >
            {subtitle}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
