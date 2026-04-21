import React from 'react';
import { Pressable, StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  width?: number;
  height?: number;
  backgroundColor?: string;
  borderRadius?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
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
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          width,
          height,
          backgroundColor: disabled ? '#AAB8C3' : backgroundColor,
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
    fontFamily: 'PretendardVariable',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
});