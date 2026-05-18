import { Fragment } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Colors } from '@/src/constants/theme';
import type { ReportMeasurementListItem } from '@/src/features/report/reportMeasurementListTypes';
import styles, { getReportMeasurementListLayout } from '@/src/features/report/components/reportMeasurementList.styles';

const WIDE_LAYOUT_MIN_WIDTH = 600;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatRotationDegree(value?: number | null) {
  if (value === null || value === undefined) return '-';
  const rounded = Math.round(Math.abs(value) * 10) / 10;

  if (Number.isInteger(rounded)) {
    return `${rounded.toFixed(0)}°`;
  }

  return `${rounded.toFixed(1)}°`;
}

function formatCurvatureDegree(value?: number | null) {
  if (value === null || value === undefined) return '-';
  return `${Math.round(Math.abs(value))}°`;
}

function getCurvatureDotColor(value?: number | null) {
  // 만곡 각도 구간에 따라 목록의 상태 점 색상을 나눈다.
  const angle = Math.abs(value ?? 0);

  if (angle < 15) {
    return Colors.mint[300];
  }

  if (angle < 25) {
    return Colors.yellow[300];
  }

  return Colors.red[300];
}

type ReportMeasurementCardProps = {
  item: ReportMeasurementListItem;
  onPress: (item: ReportMeasurementListItem) => void;
};

export default function ReportMeasurementCard({ item, onPress }: ReportMeasurementCardProps) {
  const isDisabled = !item.navigationId;
  const { width } = useWindowDimensions();
  const isWideLayout = width >= WIDE_LAYOUT_MIN_WIDTH;
  const { curvature, rotation } = item.measurementSet;
  const measurementListLayout = getReportMeasurementListLayout(width);

  if (!curvature) {
    return null;
  }

  const regions = [
    {
      key: 'upper',
      label: '상부 흉추',
      curvatureValue: curvature.secondary_thoracic_cobb,
      rotationValue: rotation?.upper_thoracic_atr,
    },
    {
      key: 'main',
      label: '주 흉추',
      curvatureValue: curvature.main_thoracic_cobb,
      rotationValue: rotation?.thoracic_atr,
    },
    {
      key: 'lumbar',
      label: '요추',
      curvatureValue: curvature.lumbar_cobb,
      rotationValue: rotation?.lumbar_atr,
    },
  ];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.measurementCard,
        {
          minHeight: measurementListLayout.cardMinHeight,
          paddingHorizontal: measurementListLayout.cardPaddingHorizontal,
          paddingVertical: measurementListLayout.cardPaddingVertical,
          borderRadius: measurementListLayout.cardRadius,
        },
        pressed && styles.pressed,
      ]}
      disabled={isDisabled}
      onPress={() => onPress(item)}
    >
      <View
        style={[
          styles.measurementCardHeader,
          {
            minHeight: measurementListLayout.headerMinHeight,
            gap: measurementListLayout.headerGap,
            marginBottom: measurementListLayout.headerMarginBottom,
          },
        ]}
      >
        <Text
          style={[
            styles.measurementDate,
            {
              fontSize: measurementListLayout.dateFontSize,
              lineHeight: measurementListLayout.dateLineHeight,
            },
          ]}
        >
          {formatDate(item.createdAt)}
        </Text>
        <View
          style={[
            styles.measurementBadge,
            {
              minWidth: measurementListLayout.measureBadgeMinWidth,
              minHeight: measurementListLayout.measureBadgeMinHeight,
              paddingHorizontal: measurementListLayout.measureBadgePaddingHorizontal,
              paddingVertical: measurementListLayout.measureBadgePaddingVertical,
              borderRadius: measurementListLayout.measureBadgeRadius,
            },
          ]}
        >
          <Text
            style={[
              styles.measurementBadgeText,
              {
                fontSize: measurementListLayout.measureBadgeTextFontSize,
                lineHeight: measurementListLayout.measureBadgeTextLineHeight,
              },
            ]}
          >
            2D 측정
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.measurementRegionRow,
          {
            gap: measurementListLayout.regionGap,
            minHeight: measurementListLayout.regionRowMinHeight,
          },
        ]}
      >
        {regions.map((region, index) => (
          <Fragment key={region.key}>
            <View style={styles.measurementRegion}>
              <View
                style={[
                  styles.measurementRegionPill,
                  {
                    minHeight: measurementListLayout.regionPillMinHeight,
                    gap: measurementListLayout.regionPillGap,
                    paddingHorizontal: measurementListLayout.regionPillPaddingHorizontal,
                    paddingVertical: measurementListLayout.regionPillPaddingVertical,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.measurementRegionLabel,
                    {
                      fontSize: measurementListLayout.regionLabelFontSize,
                      lineHeight: measurementListLayout.regionLabelLineHeight,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {region.label}
                </Text>
                <View
                  style={[
                    styles.measurementRegionDot,
                    {
                      width: measurementListLayout.regionDotSize,
                      height: measurementListLayout.regionDotSize,
                      borderRadius: measurementListLayout.regionDotRadius,
                      backgroundColor: getCurvatureDotColor(region.curvatureValue),
                    },
                  ]}
                />
              </View>

              <View
                style={[
                  styles.measurementValueRow,
                  isWideLayout ? styles.measurementValueRowWide : null,
                  {
                    gap: measurementListLayout.valueGap,
                    marginTop: measurementListLayout.valueRowMarginTop,
                    minHeight: measurementListLayout.valueRowMinHeight,
                  },
                ]}
              >
                <View style={[styles.measurementValueBlock, { width: measurementListLayout.valueBlockWidth }]}>
                  <Text
                    style={[
                      styles.measurementValueLabel,
                      {
                        fontSize: measurementListLayout.valueLabelFontSize,
                        lineHeight: measurementListLayout.valueLabelLineHeight,
                      },
                    ]}
                  >
                    만곡도
                  </Text>
                  <Text
                    style={[
                      styles.measurementCurvatureValue,
                      {
                        fontSize: measurementListLayout.valueFontSize,
                        lineHeight: measurementListLayout.valueLineHeight,
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                  >
                    {formatCurvatureDegree(region.curvatureValue)}
                  </Text>
                </View>

                <View style={[styles.measurementValueBlock, { width: measurementListLayout.valueBlockWidth }]}>
                  <Text
                    style={[
                      styles.measurementValueLabel,
                      {
                        fontSize: measurementListLayout.valueLabelFontSize,
                        lineHeight: measurementListLayout.valueLabelLineHeight,
                      },
                    ]}
                  >
                    비틀림
                  </Text>
                  <Text
                    style={[
                      styles.measurementRotationValue,
                      {
                        fontSize: measurementListLayout.valueFontSize,
                        lineHeight: measurementListLayout.valueLineHeight,
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                  >
                    {formatRotationDegree(region.rotationValue)}
                  </Text>
                </View>
              </View>
            </View>
            {index < regions.length - 1 ? (
              <View
                style={[
                  styles.measurementRegionSeparator,
                  { height: measurementListLayout.regionSeparatorHeight },
                ]}
              />
            ) : null}
          </Fragment>
        ))}
      </View>
    </Pressable>
  );
}
