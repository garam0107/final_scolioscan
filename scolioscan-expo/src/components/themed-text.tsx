import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/src/hooks/use-theme-color';
import { textFont } from '@/src/constants/fonts';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    ...textFont,
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    ...textFont,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    ...textFont,
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    ...textFont,
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    ...textFont,
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
