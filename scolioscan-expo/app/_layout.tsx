import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { MuseoModerno_700Bold, useFonts as useMuseoFonts } from '@expo-google-fonts/museomoderno';
// import { useFonts } from 'expo-font';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import 'react-native-reanimated';

import { AuthProvider } from '@/src/contexts/AuthContext';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { useAppSettingsStore } from '@/src/store/appSettingsStore';

// const pretendardFont = require('../assets/fonts/PretendardVariable.ttf');

const defaultFontFamily = 'PretendardVariable';


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
  const settingsLoaded = useAppSettingsStore((state) => state.settingsLoaded);
  const loadSettings = useAppSettingsStore((state) => state.loadSettings);
  const [museoLoaded] = useMuseoFonts({
    MuseoModerno_700Bold,
  });
  // const [fontsLoaded] = useFonts({
  //   PretendardVariable: pretendardFont,
  // });
  const hideTopSeparator = segments[0] === 'intro' || segments[0] === 'measure';

  useEffect(() => {
    // 앱 시작 시 설정값을 미리 불러와 설정 화면 진입 시 토글 깜빡임을 줄인다.
    void loadSettings().catch(() => undefined);
  }, [loadSettings]);

  if (!museoLoaded || !settingsLoaded) {
    return null;
  }

  return (
    <KeyboardProvider>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        {/* View, TopSeparator 추가해서 상단바 밑으로 표시 */}
        {/* <View style={styles.root}> */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="intro" />
            <Stack.Screen name="email-find" />
            <Stack.Screen name="email-find-message" />
            <Stack.Screen name="email-find-result" />
            <Stack.Screen name="login" />
            <Stack.Screen name="password-find" />
            <Stack.Screen name="password-find-message" />
            <Stack.Screen name="password-find-reset" />
            <Stack.Screen name="register" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="analysis-detail/[id]" />
            <Stack.Screen name="measure-loading-preview" />
            <Stack.Screen name="measure/2d" />
            <Stack.Screen name="measure/scoliometer" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="settings/password" />
            <Stack.Screen name="settings/password-message" />
            <Stack.Screen name="settings/password-reset" />
            <Stack.Screen name="profile/edit" />
             <Stack.Screen name="settings/contact" />
          </Stack>
          {/* {hideTopSeparator ? null : <TopSeparator />}
        </View> */}
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
    </KeyboardProvider>
  );
}
