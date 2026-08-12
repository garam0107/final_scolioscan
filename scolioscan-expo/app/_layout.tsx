import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { MuseoModerno_700Bold, useFonts as useMuseoFonts } from '@expo-google-fonts/museomoderno';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import 'react-native-reanimated';
import NaverLogin from '@react-native-seoul/naver-login'
import { AdsProvider } from '@/src/contexts/AdsContext';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { useEffect, useRef, useState } from 'react';
import { i18n, initializeLanguage } from '@/src/i18n';
import { usePathname } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
// 애드몹 SDK
import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';

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
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const [languageRevision, setLanguageRevision] = useState(0);
  const [museoLoaded] = useMuseoFonts({
    MuseoModerno_700Bold,
  });
  const mobileAdsInitializedRef = useRef(false);
  const [isAdsReady, setIsAdsReady] = useState(false);

  useEffect(() => {
    // 척추측정계 화면은 자체적으로 가로 방향을 고정하므로, 그 외 화면만 세로로 유지한다.
    if (pathname === '/measure/scoliometer') {
      return;
    }

    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, [pathname]);

  useEffect(() => {
    const startGoogleMobileAds = async () => {
      try {
        const { canRequestAds } = await AdsConsent.getConsentInfo();

        if (!canRequestAds || mobileAdsInitializedRef.current) {
          return;
        }

        mobileAdsInitializedRef.current = true;

        await mobileAds().initialize();
        setIsAdsReady(true);
      } catch (error) {
        console.warn('[admob] 광고 SDK 초기화 실패', error);
      }
    };

    // 앱 실행마다 최신 동의 상태를 확인하고, 필요하면 UMP 동의 화면을 표시한다.
    void AdsConsent.gatherConsent()
      .catch((error) => {
        console.warn('[ump] 개인정보 동의 처리 실패', error);
      })
      .finally(() => {
        void startGoogleMobileAds();
      });
  }, []);
  useEffect(() => {
    // 앱을 열 때 저장된 언어를 먼저 복원하고, 없으면 기기 언어를 적용한다.
    void initializeLanguage();

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

  useEffect(() => {
    // 언어 변경 시 현재 열린 화면도 즉시 다시 렌더링해 번역을 반영한다.
    // 언어가 바뀌면 현재 라우트 화면을 다시 생성해 즉시 번역을 반영한다.
    const handleLanguageChanged = () => setLanguageRevision((revision) => revision + 1);
    i18n.on('languageChanged', handleLanguageChanged);
    return () => i18n.off('languageChanged', handleLanguageChanged);
  }, []);
  
  if (!museoLoaded) {
    return null;
  }

  return (
    <KeyboardProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AdsProvider isAdsReady={isAdsReady}>
          <AuthProvider>
            <Stack
              key={`language-${languageRevision}`}
              screenOptions={{
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
        </AdsProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </KeyboardProvider>
  );
}
