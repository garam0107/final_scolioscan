import { i18n } from '@/src/i18n';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import CommonSettingsSheet from '@/src/features/settings/components/CommonSettingsSheet';
import styles, {
  getNightModeSheetLayout,
} from '@/src/features/settings/sheets/nightModeSettingsSheet.styles';

type NightModeSettingsSheetProps = {
  visible: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  onClose: () => void;
  onApply: (
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number
  ) => void;
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 10, 20, 30, 40, 50];

function convertToPicker(hour24: number) {
  const isPM = hour24 >= 12;
  const hour12 = hour24 % 12 || 12;
  return { isPM, hour12 };
}

function convertFromPicker(isPM: boolean, hour12: number) {
  let hour24 = hour12 % 12;
  if (isPM) hour24 += 12;
  return hour24;
}

export default function NightModeSettingsSheet({
  visible,
  startHour,
  startMinute,
  endHour,
  endMinute,
  onClose,
  onApply,
}: NightModeSettingsSheetProps) {
  const { width: screenWidth } = useWindowDimensions();
  const nightModeLayout = useMemo(
    () => getNightModeSheetLayout(screenWidth),
    [screenWidth]
  );

  const initialStart = useMemo(() => convertToPicker(startHour), [startHour]);
  const initialEnd = useMemo(() => convertToPicker(endHour), [endHour]);

  const [isStartPM, setIsStartPM] = useState(initialStart.isPM);
  const [localStartHour, setLocalStartHour] = useState(initialStart.hour12);
  const [localStartMinute, setLocalStartMinute] = useState(startMinute);

  const [isEndPM, setIsEndPM] = useState(initialEnd.isPM);
  const [localEndHour, setLocalEndHour] = useState(initialEnd.hour12);
  const [localEndMinute, setLocalEndMinute] = useState(endMinute);

  React.useEffect(() => {
    if (!visible) return;

    setIsStartPM(initialStart.isPM);
    setLocalStartHour(initialStart.hour12);
    setLocalStartMinute(startMinute);

    setIsEndPM(initialEnd.isPM);
    setLocalEndHour(initialEnd.hour12);
    setLocalEndMinute(endMinute);
  }, [visible, initialStart, initialEnd, startMinute, endMinute]);

  const handleApply = () => {
    const finalStartHour = convertFromPicker(isStartPM, localStartHour);
    const finalEndHour = convertFromPicker(isEndPM, localEndHour);

    onApply(finalStartHour, localStartMinute, finalEndHour, localEndMinute);
    onClose();
  };

  const renderPicker = (
    options: number[],
    currentValue: number,
    onSelect: (val: number) => void,
    suffix: string
  ) => {
    const initialIndex = options.indexOf(currentValue);
    const initialOffset =
      initialIndex >= 0 ? initialIndex * nightModeLayout.optionHeight : 0;

    return (
      <ScrollView
        style={[
          styles.pickerColumn,
          {
            width: nightModeLayout.pickerWidth,
            height: nightModeLayout.pickerHeight,
          },
        ]}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingVertical: nightModeLayout.scrollPaddingVertical,
          },
        ]}
        showsVerticalScrollIndicator={false}
        snapToInterval={nightModeLayout.optionHeight}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: initialOffset }}
        onMomentumScrollEnd={(
          e: NativeSyntheticEvent<NativeScrollEvent>
        ) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.y / nightModeLayout.optionHeight
          );

          if (options[index] !== undefined) {
            onSelect(options[index]);
          }
        }}
      >
        {options.map((opt) => {
          const selected = currentValue === opt;
          const label = opt === 0 && suffix === i18n.t("분") ? i18n.t("정각") : `${opt}${suffix}`;

          return (
            <Pressable
              key={opt}
              style={[
                styles.option,
                {
                  width: nightModeLayout.pickerWidth,
                  height: nightModeLayout.optionHeight,
                },
                selected && styles.optionSelected,
              ]}
              onPress={() => onSelect(opt)}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    fontSize: nightModeLayout.optionFontSize,
                    lineHeight: nightModeLayout.optionLineHeight,
                  },
                  selected && styles.optionTextSelected,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  };

  const renderAmPmPicker = (
    isPM: boolean,
    setIsPM: (val: boolean) => void
  ) => {
    return (
      <View
        style={[
          styles.ampmContainer,
          {
            width: nightModeLayout.pickerWidth,
            height: nightModeLayout.pickerHeight,
          },
        ]}
      >
        <View
          style={[
            styles.ampmOption,
            {
              width: nightModeLayout.pickerWidth,
              height: nightModeLayout.optionHeight,
            },
          ]}
        >
          {isPM ? (
            <Pressable onPress={() => setIsPM(false)}>
              <Text
                style={[
                  styles.ampmText,
                  {
                    fontSize: nightModeLayout.optionFontSize,
                    lineHeight: nightModeLayout.optionLineHeight,
                  },
                ]}
              >{i18n.t("오전")}</Text>
            </Pressable>
          ) : null}
        </View>

        <View
          style={[
            styles.ampmOption,
            styles.ampmOptionSelected,
            {
              width: nightModeLayout.pickerWidth,
              height: nightModeLayout.optionHeight,
            },
          ]}
        >
          <Text
            style={[
              styles.ampmText,
              styles.ampmTextSelected,
              {
                fontSize: nightModeLayout.optionFontSize,
                lineHeight: nightModeLayout.optionLineHeight,
              },
            ]}
          >
            {isPM ? i18n.t("오후") : i18n.t("오전")}
          </Text>
        </View>

        <View
          style={[
            styles.ampmOption,
            {
              width: nightModeLayout.pickerWidth,
              height: nightModeLayout.optionHeight,
            },
          ]}
        >
          {!isPM ? (
            <Pressable onPress={() => setIsPM(true)}>
              <Text
                style={[
                  styles.ampmText,
                  {
                    fontSize: nightModeLayout.optionFontSize,
                    lineHeight: nightModeLayout.optionLineHeight,
                  },
                ]}
              >{i18n.t("오후")}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  const renderTimeSection = (
    title: string,
    isPM: boolean,
    setIsPM: (val: boolean) => void,
    hour: number,
    setHour: (val: number) => void,
    minute: number,
    setMinute: (val: number) => void
  ) => {
    return (
      <View
        style={[
          styles.section,
          {
            width: nightModeLayout.contentWidth,
            paddingHorizontal: nightModeLayout.sectionPaddingHorizontal,
            paddingVertical: nightModeLayout.sectionPaddingVertical,
            columnGap: nightModeLayout.columnGap,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              width: nightModeLayout.titleWidth,
              fontSize: nightModeLayout.titleFontSize,
              lineHeight: nightModeLayout.optionLineHeight,
            },
          ]}
        >
          {title}
        </Text>

        {renderAmPmPicker(isPM, setIsPM)}
        {renderPicker(HOURS, hour, setHour, i18n.t("시"))}
        {renderPicker(MINUTES, minute, setMinute, i18n.t("분"))}
      </View>
    );
  };

  return (
    <CommonSettingsSheet
      visible={visible}
      title={i18n.t("야간 모드 시간 설정")}
      description={i18n.t("야간 모드로 설정하고싶은 시간을 설정해주세요")}
      onClose={onClose}
      actions={[
        { label: i18n.t("취소"), onPress: onClose, variant: 'default' },
        { label: i18n.t("적용"), onPress: handleApply, variant: 'primary' },
      ]}
    >
      <View
        style={[
          styles.sheetCard,
          {
            paddingTop: nightModeLayout.cardPaddingTop,
            paddingBottom: nightModeLayout.cardPaddingBottom,
          },
        ]}
      >
        {renderTimeSection(
          i18n.t("시작"),
          isStartPM,
          setIsStartPM,
          localStartHour,
          setLocalStartHour,
          localStartMinute,
          setLocalStartMinute
        )}

        {renderTimeSection(
          i18n.t("종료"),
          isEndPM,
          setIsEndPM,
          localEndHour,
          setLocalEndHour,
          localEndMinute,
          setLocalEndMinute
        )}
      </View>
    </CommonSettingsSheet>
  );
}