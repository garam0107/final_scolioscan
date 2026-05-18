import React from 'react';
import { Pressable, StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';
import { textFont } from '@/src/constants/fonts';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  width?: ViewStyle['width'];
  height?: ViewStyle['height'];
  backgroundColor?: string;
  borderRadius?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  disabledBackgroundColor?: string;
};

export default function PrimaryButton({
  title,
  onPress,
  width = 130,
  height = 50,
  backgroundColor = '#5E9F9E',
  borderRadius = 6,
  style,
  textStyle,
  disabled = false,
  disabledBackgroundColor = '#AAB8C3',
}: PrimaryButtonProps) {
  // 화면별 크기와 색상은 props로 바꾸되 눌림과 비활성 상태는 공통으로 처리한다.
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          width,
          height,
          backgroundColor: disabled ? disabledBackgroundColor : backgroundColor,
          borderRadius,
        },
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  pressed: {
    opacity: 0.9,
  },
  text: {
    color: '#FFFFFF',
    ...textFont,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
});
