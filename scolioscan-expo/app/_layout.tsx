import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { MuseoModerno_700Bold, useFonts as useMuseoFonts } from '@expo-google-fonts/museomoderno';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import 'react-native-reanimated';
import NaverLogin from '@react-native-seoul/naver-login'
import { AuthProvider } from '@/src/contexts/AuthContext';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { useEffect } from 'react';

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
      style: [{ defaultFontFamily }, props?.style],
    }, ref);
  };
}

// allowFontScaling 설정으로 폰트 사이즈를 고정한다.
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
  const [museoLoaded] = useMuseoFonts({
    MuseoModerno_700Bold,
  });

  useEffect(() => {
    const consumerKey = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID;
    const consumerSecret = process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET;
    const serviceUrlSchemeIOS = process.env.EXPO_PUBLIC_NAVER_URL_SCHEME_IOS;

    if (!consumerKey || !consumerSecret || !serviceUrlSchemeIOS) {
      console.warn('Naver login env is missing');
      return;
    }

    NaverLogin.initialize({
      appName: 'Scolioscan',
      consumerKey,
      consumerSecret,
      serviceUrlSchemeIOS,
    });
  }, []);
  
  if (!museoLoaded) {
    return null;
  }

  return (
    <KeyboardProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <Stack screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: '#FFFFFF',
            },
          }}>
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
            <Stack.Screen name="measure/guide" />
            <Stack.Screen name="measure/guide-2d-camera" />
            <Stack.Screen name="measure/guide-3d-camera" />
            <Stack.Screen name="measure/guide-spine" />
            <Stack.Screen name="measure/2d" />
            <Stack.Screen name="measure/scoliometer" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="settings/password" />
            <Stack.Screen name="settings/password-message" />
            <Stack.Screen name="settings/password-reset" />
            <Stack.Screen name="profile/edit" />
            <Stack.Screen name="settings/contact" />
            <Stack.Screen name="oauth/index" options={{ gestureEnabled: false }} />
          </Stack>
          {/* {hideTopSeparator ? null : <TopSeparator />} */}
        </AuthProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </KeyboardProvider>
  );
}
