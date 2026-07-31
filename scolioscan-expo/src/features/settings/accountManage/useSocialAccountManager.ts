import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { login as kakaoLogin, unlink as unlinkKakao } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { i18n } from '@/src/i18n';

import { authAPI } from '@/src/api/auth';
import { userAPI } from '@/src/api/user';
import { normalizeApiError } from '@/src/features/settings/accountManage/accountManageUtils';
import { getCurrentDeviceLabel } from '@/src/features/settings/accountManage/accountManageUtils';
import type { SocialLoginMethod } from '@/src/features/settings/accountManage/components/accountProfileSection.types';
import { getOrCreateDeviceId } from '@/src/lib/tokenStorage';
import type { SocialAuthResponse } from '@/src/types/auth';
import type { SocialProvider, UserResponse } from '@/src/types/user';

type ToastTone = 'info' | 'success' | 'warning' | 'error';
type SocialSheetMode = 'link' | 'unlink';

type UseSocialAccountManagerParams = {
  refreshSession: () => Promise<void>;
  showToast: (message: string, tone?: ToastTone) => void;
  user: UserResponse | null;
};

const PENDING_SOCIAL_UNLINK_STORAGE_KEY = 'pending_social_unlinks';
// 사용자별로 대기 중인 연동 해제 목록을 분리해 다른 계정에 적용되지 않도록 한다.
const getPendingSocialUnlinksStorageKey = (userId: string) =>
  `${PENDING_SOCIAL_UNLINK_STORAGE_KEY}:${userId}`;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export function useSocialAccountManager({
  refreshSession,
  showToast,
  user,
}: UseSocialAccountManagerParams) {
  const [linkingProvider, setLinkingProvider] = useState<SocialProvider | null>(null);
  const [unlinkingProvider, setUnlinkingProvider] = useState<SocialProvider | null>(null);
  const [syncingPendingUnlinks, setSyncingPendingUnlinks] = useState(false);
  const [socialSheetProvider, setSocialSheetProvider] = useState<SocialProvider | null>(null);
  const [socialSheetMode, setSocialSheetMode] = useState<SocialSheetMode>('unlink');
  const activeUserIdRef = useRef<string | null>(user?.id ? String(user.id) : null);
  activeUserIdRef.current = user?.id ? String(user.id) : null;

  useEffect(() => {
    // 계정 관리 화면에서도 구글 SDK 로그인 화면을 바로 띄울 수 있게 설정을 맞춘다.
    if (!GOOGLE_WEB_CLIENT_ID) {
      return;
    }

    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
    });
  }, []);

  useEffect(() => {
    // SDK 해제 후 DB 삭제만 남은 provider가 있으면 화면 진입 후 자동 복구를 시도한다.
    if (!user?.id || syncingPendingUnlinks || unlinkingProvider) {
      return;
    }

    // 기존 전역 키는 소유자를 확인할 수 없으므로 재시도하지 않고 폐기한다.
    void AsyncStorage.removeItem(PENDING_SOCIAL_UNLINK_STORAGE_KEY);
    void retryPendingSocialUnlinks(String(user.id));
  }, [syncingPendingUnlinks, unlinkingProvider, user?.id]);

  async function loadPendingSocialUnlinks(userId: string) {
    // 부분 성공 상태를 복구할 수 있게 provider 목록을 로컬에 저장한다.
    const rawValue = await AsyncStorage.getItem(getPendingSocialUnlinksStorageKey(userId));

    if (!rawValue) {
      return [] as SocialProvider[];
    }

    try {
      const parsedValue = JSON.parse(rawValue);

      if (!Array.isArray(parsedValue)) {
        return [] as SocialProvider[];
      }

      return parsedValue.filter(
        (provider): provider is SocialProvider =>
          provider === 'google' ||
          provider === 'naver' ||
          provider === 'kakao' ||
          provider === 'apple',
      );
    } catch {
      return [] as SocialProvider[];
    }
  }

  async function savePendingSocialUnlinks(userId: string, providers: SocialProvider[]) {
    // 같은 provider가 중복 저장되지 않게 정리해서 보관한다.
    const uniqueProviders = Array.from(new Set(providers));
    await AsyncStorage.setItem(
      getPendingSocialUnlinksStorageKey(userId),
      JSON.stringify(uniqueProviders),
    );
  }

  async function addPendingSocialUnlink(userId: string, provider: SocialProvider) {
    const providers = await loadPendingSocialUnlinks(userId);
    await savePendingSocialUnlinks(userId, [...providers, provider]);
  }

  async function removePendingSocialUnlink(userId: string, provider: SocialProvider) {
    const providers = await loadPendingSocialUnlinks(userId);
    await savePendingSocialUnlinks(userId, providers.filter((item) => item !== provider));
  }

  async function retryPendingSocialUnlinks(userId: string) {
    const providers = await loadPendingSocialUnlinks(userId);

    if (providers.length === 0) {
      return;
    }

    try {
      setSyncingPendingUnlinks(true);

      let hasResolvedPendingUnlink = false;

      for (const provider of providers) {
        // 계정이 전환되면 이전 계정의 재시도를 즉시 중단해 현재 계정에 적용되지 않게 한다.
        if (activeUserIdRef.current !== userId) {
          break;
        }

        try {
          // SDK는 이미 해제됐을 수 있으므로 DB row 삭제만 멱등적으로 재시도한다.
          await userAPI.deleteSocialAccount(provider);
          if (activeUserIdRef.current !== userId) {
            break;
          }
          await removePendingSocialUnlink(userId, provider);
          hasResolvedPendingUnlink = true;
        } catch {
          // 실패한 항목은 다음 진입에서도 다시 재시도할 수 있게 남겨둔다.
        }
      }

      if (hasResolvedPendingUnlink) {
        await refreshSession();
      }
    } finally {
      setSyncingPendingUnlinks(false);
    }
  }

  function getSocialProviderLabel(provider: SocialProvider) {
    if (provider === 'google') return '구글';
    if (provider === 'naver') return '네이버';
    if (provider === 'kakao') return '카카오';
    return '애플';
  }

  function getSocialProviderEmail(provider: SocialProvider) {
    if (provider === 'google') return user?.social_accounts.google.email ?? null;
    if (provider === 'naver') return user?.social_accounts.naver.email ?? null;
    if (provider === 'kakao') return user?.social_accounts.kakao.email ?? null;
    return user?.social_accounts.apple.email ?? null;
  }

  function extractSocialSdkErrorMessage(error: unknown) {
    // 네이티브 SDK reject 객체에서도 message/code를 최대한 읽어 사용자에게 정확한 원인을 보여준다.
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null) {
      const message = 'message' in error ? (error as { message?: unknown }).message : undefined;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }

      const code = 'code' in error ? (error as { code?: unknown }).code : undefined;
      if (typeof code === 'string' && code.trim()) {
        return code;
      }
    }

    return '';
  }

  function isSocialLoginCancelled(message: string) {
    const normalizedMessage = message.toLowerCase();

    return (
      normalizedMessage.includes('cancelled') ||
      normalizedMessage.includes('canceled') ||
      normalizedMessage.includes('취소')
    );
  }

  function extractGoogleIdToken(result: unknown) {
    // 구글 SDK 응답 형태 차이를 흡수해서 verify API에 넘길 idToken만 꺼낸다.
    if (typeof result !== 'object' || result === null) {
      return null;
    }

    const payload = result as {
      idToken?: string;
      data?: {
        idToken?: string;
      };
    };

    return payload.idToken ?? payload.data?.idToken ?? null;
  }

  async function verifySocialLogin(provider: SocialProvider): Promise<SocialAuthResponse> {
    // 계정 관리 화면에서는 verify API만 호출하고 현재 로그인 세션은 유지한다.
    const deviceId = await getOrCreateDeviceId();
    const deviceName = getCurrentDeviceLabel();

    if (provider === 'google') {
      if (!GOOGLE_WEB_CLIENT_ID) {
        throw new Error('구글 로그인 설정이 아직 완료되지 않았습니다.');
      }

      const signInResult = await GoogleSignin.signIn();
      if (signInResult.type === 'cancelled') {
          throw new Error('구글 로그인이 취소되었습니다.');
        }
      const idToken = extractGoogleIdToken(signInResult);
     
      if (!idToken) {
        throw new Error('구글 로그인 정보를 다시 가져오지 못했습니다.');
      }

      const response = await authAPI.verifyGoogleSocialLogin({
        id_token: idToken,
        device_id: deviceId,
        device_name: deviceName,
      });

      return response.data;
    }

    if (provider === 'kakao') {
      const token = await kakaoLogin();

      if (!token?.accessToken) {
        throw new Error('카카오 로그인 정보를 다시 가져오지 못했습니다.');
      }

      const response = await authAPI.verifyKakaoSocialLogin({
        access_token: token.accessToken,
        device_id: deviceId,
        device_name: deviceName,
      });

      return response.data;
    }

    if (provider === 'apple') {
      if (Platform.OS !== 'ios' || !(await AppleAuthentication.isAvailableAsync())) {
        throw new Error('이 기기에서는 애플 로그인을 사용할 수 없습니다.');
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken || !credential.authorizationCode) {
        throw new Error('애플 인증 정보를 받지 못했습니다.');
      }

      const response = await authAPI.verifyAppleSocialLogin({
        identity_token: credential.identityToken,
        authorization_code: credential.authorizationCode,
        device_id: deviceId,
        device_name: deviceName,
      });

      return response.data;
    }

    const result = await NaverLogin.login();
    const successResponse = (result as { successResponse?: { accessToken?: string } }).successResponse;
    const failureResponse = (result as { failureResponse?: { message?: string; isCancel?: boolean } }).failureResponse;

    if (failureResponse?.isCancel) {
      throw new Error('네이버 로그인이 취소되었습니다.');
    }

    if (!successResponse?.accessToken) {
      throw new Error(failureResponse?.message ?? '네이버 로그인 정보를 다시 가져오지 못했습니다.');
    }

    const response = await authAPI.verifyNaverSocialLogin({
      access_token: successResponse.accessToken,
      device_id: deviceId,
      device_name: deviceName,
    });

    return response.data;
  }

  function isNaverDeleteTokenRetryableError(message: string) {
    const normalizedMessage = message.toLowerCase();

    return (
      normalizedMessage.length === 0 ||
      normalizedMessage.includes('token') ||
      normalizedMessage.includes('login') ||
      normalizedMessage.includes('oauth') ||
      normalizedMessage.includes('unauthorized') ||
      normalizedMessage.includes('access_denied')
    );
  }

  async function ensureNaverDeleteToken() {
    // 네이버 SDK 내부 토큰이 없는 경우 재로그인으로 토큰을 확보한 뒤 삭제를 한 번 더 시도한다.
    try {
      await NaverLogin.deleteToken();
      return;
    } catch (error) {
      const message = extractSocialSdkErrorMessage(error);

      if (!isNaverDeleteTokenRetryableError(message)) {
        throw new Error(message || '네이버 연결 해제에 실패했습니다.');
      }
    }

    const loginResult = await NaverLogin.login();
    const successResponse = (loginResult as { successResponse?: { accessToken?: string } }).successResponse;
    const failureResponse = (loginResult as { failureResponse?: { message?: string; isCancel?: boolean } }).failureResponse;

    if (failureResponse?.isCancel) {
      throw new Error('네이버 로그인 후 연결 해제가 취소되었습니다.');
    }

    if (!successResponse?.accessToken) {
      throw new Error(failureResponse?.message ?? '네이버 로그인 정보를 다시 가져오지 못했습니다.');
    }

    await NaverLogin.deleteToken();
  }

  async function unlinkSocialWithSdk(provider: SocialProvider) {
    // SDK 해제가 성공한 경우에만 백엔드 row 삭제 단계로 넘긴다.
    if (provider === 'apple') {
      // Apple authorization은 암호화 refresh token을 가진 서버에서 취소한다.
      return;
    }

    if (provider === 'google') {
      await GoogleSignin.revokeAccess();
      return;
    }

    if (provider === 'kakao') {
      await unlinkKakao();
      return;
    }

    await ensureNaverDeleteToken();
  }

  async function handleSocialLink(provider: SocialProvider) {
    // 연결하기 버튼은 우선 각 SDK 로그인/동의 화면만 띄우고 이후 연동 로직은 다음 단계에서 붙인다.
    if (provider === 'google') {
      if (!GOOGLE_WEB_CLIENT_ID) {
        throw new Error('구글 로그인 설정이 아직 완료되지 않았습니다.');
      }

      await GoogleSignin.signIn();
      return;
    }

    if (provider === 'kakao') {
      await kakaoLogin();
      return;
    }

    if (provider === 'apple') {
      await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      return;
    }

    const result = await NaverLogin.login();
    const failureResponse = (result as { failureResponse?: { message?: string; isCancel?: boolean } }).failureResponse;

    if (failureResponse?.isCancel) {
      throw new Error('네이버 로그인이 취소되었습니다.');
    }
  }

  async function handleSocialLinkWithVerify(provider: SocialProvider) {
    // 계정 관리 화면에서는 verify 결과를 확인한 뒤에만 현재 계정 연결 API를 호출한다.
    if (linkingProvider || unlinkingProvider || syncingPendingUnlinks) {
      return;
    }

    try {
      setLinkingProvider(provider);

      const verifyResponse = await verifySocialLogin(provider);

      if (verifyResponse.status === 'login_success') {
        showToast(i18n.t('social.alreadyLinked', {
          provider: i18n.t(getSocialProviderLabel(provider)),
        }), 'warning');
        return;
      }

      if (!verifyResponse.social_temp_token) {
        throw new Error('소셜 계정 연결 정보를 다시 가져오지 못했습니다.');
      }

      await authAPI.linkCurrentSocialAccount({
        social_temp_token: verifyResponse.social_temp_token,
      });
      await refreshSession();
      showToast(i18n.t('social.linkComplete', {
        provider: i18n.t(getSocialProviderLabel(provider)),
      }), 'success');
    } finally {
      setLinkingProvider(null);
    }
  }

  async function handleSocialUnlink(provider: SocialProvider) {
    // 중복 요청을 막고 SDK 해제 이후에만 DB 삭제를 요청한다.
    if (linkingProvider || unlinkingProvider || syncingPendingUnlinks) {
      return;
    }

    const userId = user?.id ? String(user.id) : null;
    if (!userId) {
      showToast('로그인 정보를 확인할 수 없습니다.', 'error');
      return;
    }

    try {
      setUnlinkingProvider(provider);
      await unlinkSocialWithSdk(provider);
      if (activeUserIdRef.current !== userId) {
        return;
      }
      await addPendingSocialUnlink(userId, provider);
      await userAPI.deleteSocialAccount(provider);
      await removePendingSocialUnlink(userId, provider);
      await refreshSession();
      showToast(i18n.t('social.unlinkComplete', {
        provider: i18n.t(getSocialProviderLabel(provider)),
      }), 'success');
    } catch (error) {
      const sdkMessage = extractSocialSdkErrorMessage(error);
      showToast(sdkMessage || normalizeApiError(error), 'error');
    } finally {
      setSocialSheetProvider(null);
      setUnlinkingProvider(null);
    }
  }

  function openSocialLinkSheet(provider: SocialProvider, mode: SocialSheetMode) {
    // 연결/해제는 즉시 실행하지 않고 확인 시트를 먼저 보여준다.
    if (linkingProvider || unlinkingProvider || syncingPendingUnlinks) {
      return;
    }

    setSocialSheetMode(mode);
    setSocialSheetProvider(provider);
  }

  function closeSocialLinkSheet() {
    if (linkingProvider || unlinkingProvider) {
      return;
    }

    setSocialSheetProvider(null);
  }

  function confirmSocialSheet() {
    if (!socialSheetProvider) {
      return;
    }

    if (socialSheetMode === 'unlink') {
      void handleSocialUnlink(socialSheetProvider);
      return;
    }

    closeSocialLinkSheet();
    void handleSocialLinkWithVerify(socialSheetProvider).catch((error) => {
      const sdkMessage = extractSocialSdkErrorMessage(error);

      if (isSocialLoginCancelled(sdkMessage)) {
        return;
      }

      showToast(sdkMessage || normalizeApiError(error), 'error');
    });
  }

  const socialLoginMethods: SocialLoginMethod[] = [
    {
      provider: 'google',
      isLinked: user?.social_accounts.google.is_linked ?? false,
      email: user?.social_accounts.google.email ?? null,
      onPress:
        unlinkingProvider === null && !syncingPendingUnlinks
          ? () => openSocialLinkSheet('google', user?.social_accounts.google.is_linked ? 'unlink' : 'link')
          : undefined,
    },
    {
      provider: 'naver',
      isLinked: user?.social_accounts.naver.is_linked ?? false,
      email: user?.social_accounts.naver.email ?? null,
      onPress:
        unlinkingProvider === null && !syncingPendingUnlinks
          ? () => openSocialLinkSheet('naver', user?.social_accounts.naver.is_linked ? 'unlink' : 'link')
          : undefined,
    },
    {
      provider: 'kakao',
      isLinked: user?.social_accounts.kakao.is_linked ?? false,
      email: user?.social_accounts.kakao.email ?? null,
      onPress:
        unlinkingProvider === null && !syncingPendingUnlinks
          ? () => openSocialLinkSheet('kakao', user?.social_accounts.kakao.is_linked ? 'unlink' : 'link')
          : undefined,
    },
    ...(Platform.OS === 'ios'
      ? [{
          provider: 'apple' as const,
          isLinked: user?.social_accounts.apple.is_linked ?? false,
          email: user?.social_accounts.apple.email ?? null,
          actionLabel:
            user?.is_apple_direct_signup &&
            user.social_accounts.apple.is_linked
              ? i18n.t('해제 불가')
              : undefined,
          onPress:
            unlinkingProvider === null && !syncingPendingUnlinks
              ? () => {
                  const isAppleDirectSignup =
                    user?.is_apple_direct_signup &&
                    user.social_accounts.apple.is_linked;

                  if (isAppleDirectSignup) {
                    // Apple 직접 가입 계정은 비밀번호 로그인이 없으므로 Apple 연결을 해제할 수 없다.
                    showToast(i18n.t('Apple 직접 가입 계정은 Apple 연결을 해제할 수 없습니다.'), 'warning');
                    return;
                  }

                  openSocialLinkSheet(
                    'apple',
                    user?.social_accounts.apple.is_linked ? 'unlink' : 'link',
                  );
                }
              : undefined,
        }]
      : []),
  ];

  return {
    closeSocialLinkSheet,
    confirmSocialSheet,
    socialLinkMethods: socialLoginMethods,
    socialSheetEmail: socialSheetProvider ? getSocialProviderEmail(socialSheetProvider) : null,
    socialSheetMode,
    socialSheetProvider,
    socialSheetSubmitting: linkingProvider !== null || unlinkingProvider !== null,
  };
}
