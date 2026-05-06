import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { MuseoModerno_700Bold, useFonts as useMuseoFonts } from '@expo-google-fonts/museomoderno';
// import { useFonts } from 'expo-font';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import 'react-native-reanimated';

import { AuthProvider } from '@/src/contexts/AuthContext';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

// const pretendardFont = require('../assets/fonts/PretendardVariable.ttf');

const defaultFontFamily = 'PretendardVariable';
// 상단바 아래 그라데이션
function TopSeparator() {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="none"
      style={[
        styles.topSeparator,
        {
          top: insets.top,
        },
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 12" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="topSeparatorGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#8ED7D2" stopOpacity={0.35} />
            <Stop offset="100%" stopColor="#8ED7D2" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="12" fill="url(#topSeparatorGradient)" />
      </Svg>
    </View>
  );
}

function applyDefaultFont(component: typeof Text | typeof TextInput) {
  const defaultRender = (component as typeof Text & { render?: (...args: any[]) => any }).render;

  if (!defaultRender) return;

  (component as typeof Text & { render?: (...args: any[]) => any }).render = function renderWithDefaultFont(
    props: any,
    ref: any,
  ) {
    const flattenedStyle = StyleSheet.flatten(props?.style) ?? {};
    if (flattenedStyle.fontFamily) {
      return defaultRender.call(this, props, ref);
    }

    return defaultRender.call(this, {
      ...props,
      style: [{defaultFontFamily}, props?.style],
    }, ref);
  };
}

const textDefaultProps = (Text as typeof Text & { defaultProps?: { allowFontScaling?: boolean; maxFontSizeMultiplier?: number } }).defaultProps ?? {};
textDefaultProps.allowFontScaling = false;
textDefaultProps.maxFontSizeMultiplier = 1;
(Text as typeof Text & { defaultProps?: typeof textDefaultProps }).defaultProps = textDefaultProps;

const textInputDefaultProps = (TextInput as typeof TextInput & { defaultProps?: { allowFontScaling?: boolean; maxFontSizeMultiplier?: number } }).defaultProps ?? {};
textInputDefaultProps.allowFontScaling = false;
textInputDefaultProps.maxFontSizeMultiplier = 1;
(TextInput as typeof TextInput & { defaultProps?: typeof textInputDefaultProps }).defaultProps = textInputDefaultProps;

applyDefaultFont(Text);
applyDefaultFont(TextInput);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const [museoLoaded] = useMuseoFonts({
    MuseoModerno_700Bold,
  });
  // const [fontsLoaded] = useFonts({
  //   PretendardVariable: pretendardFont,
  // });
  const hideTopSeparator = segments[0] === 'intro' || segments[0] === 'measure';

  if (!museoLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        {/* View, TopSeparator 추가해서 상단바 밑으로 표시 */}
        <View style={styles.root}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="intro" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="measure/2d" />
            <Stack.Screen name="measure/scoliometer" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="settings/password" />
            <Stack.Screen name="settings/password-message" />
            <Stack.Screen name="settings/password-reset" />
            <Stack.Screen name="profile/edit" />
          </Stack>
          {hideTopSeparator ? null : <TopSeparator />}
        </View>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
// 상단바 아래 그라데이션 스타일 
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  topSeparator: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 12,
    zIndex: 10,
  },
});
