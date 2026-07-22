import { i18n } from '@/src/i18n';
import { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { ReportMeasurementListMonthMode } from '@/src/store/reportMeasurementListFilterStore';
import {
  MONTH_OPTIONS,
  getMonthSelectionYears,
  isFutureMonth,
} from '@/src/features/report/utils/reportMonthFilter';
import styles, { getReportMonthSheetLayout } from '@/src/features/report/styles/reportMonthSheet.styles';

type ReportMonthSheetProps = {
  visible: boolean;
  bottomInset: number;
  currentDate: Date;
  mode: ReportMeasurementListMonthMode;
  selectedYear: number;
  selectedMonth: number;
  onClose: () => void;
  onSelectAll: () => void;
  onSelectSpecificMode: () => void;
  onSelectYear: (year: number) => void;
  onSelectMonth: (month: number) => void;
};

export default function ReportMonthSheet({
  visible,
  bottomInset,
  currentDate,
  mode,
  selectedYear,
  selectedMonth,
  onClose,
  onSelectAll,
  onSelectSpecificMode,
  onSelectYear,
  onSelectMonth,
}: ReportMonthSheetProps) {
  const { width: screenWidth } = useWindowDimensions();
  const monthSheetLayout = useMemo(() => getReportMonthSheetLayout(screenWidth), [screenWidth]);
  const monthSelectionYears = useMemo(() => getMonthSelectionYears(currentDate), [currentDate]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.monthSheetOverlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View
          style={[
            styles.monthSheetCard,
            {
              marginBottom: bottomInset,
              paddingHorizontal: monthSheetLayout.cardPaddingHorizontal,
              paddingTop: monthSheetLayout.cardPaddingTop,
              paddingBottom: monthSheetLayout.cardPaddingBottom,
            },
          ]}
        >
          <Text
            style={[
              styles.monthSheetTitle,
              {
                fontSize: monthSheetLayout.titleFontSize,
                lineHeight: monthSheetLayout.titleLineHeight,
              },
            ]}
          >{i18n.t("날짜 선택")}</Text>
          <Text
            style={[
              styles.monthSheetDescription,
              {
                fontSize: monthSheetLayout.descriptionFontSize,
                lineHeight: monthSheetLayout.descriptionLineHeight,
              },
            ]}
          >{i18n.t("보고싶은 리포트의 연월을 설정해주세요")}</Text>

          <View
            style={[
              styles.monthPickerRow,
              {
                marginTop: monthSheetLayout.rowMarginTop,
                width: monthSheetLayout.rowWidth,
                minHeight: monthSheetLayout.rowMinHeight,
                gap: monthSheetLayout.rowGap,
              },
            ]}
          >
            <View
              style={[
                styles.monthPickerColumn,
                styles.monthPickerSideColumn,
                { width: monthSheetLayout.sideColumnWidth },
              ]}
            >
              <Pressable
                style={[
                  styles.monthPickerOption,
                  {
                    width: monthSheetLayout.sideColumnWidth,
                    minHeight: monthSheetLayout.optionMinHeight,
                  },
                  mode === 'all' ? styles.monthPickerOptionSelected : null,
                ]}
                onPress={onSelectAll}
              >
                <Text
                  style={[
                    styles.monthPickerOptionText,
                    {
                      fontSize: monthSheetLayout.optionFontSize,
                      lineHeight: monthSheetLayout.optionLineHeight,
                    },
                    mode === 'all' ? styles.monthPickerOptionTextSelected : null,
                    mode === 'specific' ? styles.monthPickerOptionTextMuted : null,
                  ]}
                >{i18n.t("전체")}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.monthPickerOption,
                  {
                    width: monthSheetLayout.sideColumnWidth,
                    minHeight: monthSheetLayout.optionMinHeight,
                  },
                  mode === 'specific' ? styles.monthPickerOptionSelected : null,
                ]}
                onPress={onSelectSpecificMode}
              >
                <Text
                  style={[
                    styles.monthPickerOptionText,
                    {
                      fontSize: monthSheetLayout.optionFontSize,
                      lineHeight: monthSheetLayout.optionLineHeight,
                    },
                    mode === 'specific' ? styles.monthPickerOptionTextSelected : null,
                    mode === 'all' ? styles.monthPickerOptionTextMuted : null,
                  ]}
                >{i18n.t("지정")}</Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.monthPickerColumn,
                styles.monthPickerYearColumn,
                { width: monthSheetLayout.yearColumnWidth },
              ]}
            >
              {monthSelectionYears.map((year) => {
                const selected = mode === 'specific' && selectedYear === year;

                return (
                  <Pressable
                    key={year}
                    style={[
                      styles.monthPickerOption,
                      {
                        width: monthSheetLayout.yearColumnWidth,
                        minHeight: monthSheetLayout.optionMinHeight,
                      },
                      selected ? styles.monthPickerOptionSelected : null,
                    ]}
                    onPress={() => onSelectYear(year)}
                  >
                    <Text
                      style={[
                        styles.monthPickerOptionText,
                        {
                          fontSize: monthSheetLayout.optionFontSize,
                          lineHeight: monthSheetLayout.optionLineHeight,
                        },
                        selected ? styles.monthPickerOptionTextSelected : null,
                        mode === 'all' ? styles.monthPickerOptionTextMuted : null,
                      ]}
                    >
                      {year}{i18n.t("년")}</Text>
                  </Pressable>
                );
              })}
            </View>

            <ScrollView
              style={[
                styles.monthPickerScrollColumn,
                styles.monthPickerSideColumn,
                {
                  width: monthSheetLayout.sideColumnWidth,
                  maxHeight: monthSheetLayout.scrollMaxHeight,
                },
              ]}
              contentContainerStyle={[
                styles.monthPickerScrollContent,
                { paddingVertical: monthSheetLayout.scrollPaddingVertical },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {MONTH_OPTIONS.map((month) => {
                const disabled = isFutureMonth(selectedYear, month, currentDate);
                const selected = mode === 'specific' && selectedMonth === month && !disabled;

                return (
                  <Pressable
                    key={month}
                    disabled={disabled}
                    style={[
                      styles.monthPickerOption,
                      {
                        width: monthSheetLayout.sideColumnWidth,
                        minHeight: monthSheetLayout.optionMinHeight,
                      },
                      selected ? styles.monthPickerOptionSelected : null,
                    ]}
                    onPress={() => onSelectMonth(month)}
                  >
                    <Text
                      style={[
                        styles.monthPickerOptionText,
                        {
                          fontSize: monthSheetLayout.optionFontSize,
                          lineHeight: monthSheetLayout.optionLineHeight,
                        },
                        selected ? styles.monthPickerOptionTextSelected : null,
                        mode === 'all' || disabled ? styles.monthPickerOptionTextMuted : null,
                      ]}
                    >
                      {month}{i18n.t("월")}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}
