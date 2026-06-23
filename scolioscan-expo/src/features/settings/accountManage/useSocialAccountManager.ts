import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { login as kakaoLogin, unlink as unlinkKakao } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';
import { useEffect, useState } from 'react';

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
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

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

  useEffect(() => {
    // 계정 관리 화면에서도 구글 SDK 로그인 화면을 바로 띄울 수 있게 설정을 맞춘다.
    if (!GOOGLE_WEB_CLIENT_ID) {
      return;
    }

    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });
  }, []);

  useEffect(() => {
    // SDK 해제 후 DB 삭제만 남은 provider가 있으면 화면 진입 후 자동 복구를 시도한다.
    if (!user?.id || syncingPendingUnlinks || unlinkingProvider) {
      return;
    }

    void retryPendingSocialUnlinks();
  }, [syncingPendingUnlinks, unlinkingProvider, user?.id]);

  async function loadPendingSocialUnlinks() {
    // 부분 성공 상태를 복구할 수 있게 provider 목록을 로컬에 저장한다.
    const rawValue = await AsyncStorage.getItem(PENDING_SOCIAL_UNLINK_STORAGE_KEY);

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
          provider === 'google' || provider === 'naver' || provider === 'kakao',
      );
    } catch {
      return [] as SocialProvider[];
    }
  }

  async function savePendingSocialUnlinks(providers: SocialProvider[]) {
    // 같은 provider가 중복 저장되지 않게 정리해서 보관한다.
    const uniqueProviders = Array.from(new Set(providers));
    await AsyncStorage.setItem(PENDING_SOCIAL_UNLINK_STORAGE_KEY, JSON.stringify(uniqueProviders));
  }

  async function addPendingSocialUnlink(provider: SocialProvider) {
    const providers = await loadPendingSocialUnlinks();
    await savePendingSocialUnlinks([...providers, provider]);
  }

  async function removePendingSocialUnlink(provider: SocialProvider) {
    const providers = await loadPendingSocialUnlinks();
    await savePendingSocialUnlinks(providers.filter((item) => item !== provider));
  }

  async function retryPendingSocialUnlinks() {
    const providers = await loadPendingSocialUnlinks();

    if (providers.length === 0) {
      return;
    }

    try {
      setSyncingPendingUnlinks(true);

      let hasResolvedPendingUnlink = false;

      for (const provider of providers) {
        try {
          // SDK는 이미 해제됐을 수 있으므로 DB row 삭제만 멱등적으로 재시도한다.
          await userAPI.deleteSocialAccount(provider);
          await removePendingSocialUnlink(provider);
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
    return '카카오';
  }

  function getSocialProviderEmail(provider: SocialProvider) {
    if (provider === 'google') return user?.social_accounts.google.email ?? null;
    if (provider === 'naver') return user?.social_accounts.naver.email ?? null;
    return user?.social_accounts.kakao.email ?? null;
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
        showToast(`${getSocialProviderLabel(provider)} 소셜 계정은 이미 다른 계정에 연결되어 있습니다.`, 'warning');
        return;
      }

      if (!verifyResponse.social_temp_token) {
        throw new Error('소셜 계정 연결 정보를 다시 가져오지 못했습니다.');
      }

      await authAPI.linkCurrentSocialAccount({
        social_temp_token: verifyResponse.social_temp_token,
      });
      await refreshSession();
      showToast(`${getSocialProviderLabel(provider)} 소셜 연동이 완료되었습니다.`, 'success');
    } finally {
      setLinkingProvider(null);
    }
  }

  async function handleSocialUnlink(provider: SocialProvider) {
    // 중복 요청을 막고 SDK 해제 이후에만 DB 삭제를 요청한다.
    if (linkingProvider || unlinkingProvider || syncingPendingUnlinks) {
      return;
    }

    try {
      setUnlinkingProvider(provider);
      await unlinkSocialWithSdk(provider);
      await addPendingSocialUnlink(provider);
      await userAPI.deleteSocialAccount(provider);
      await removePendingSocialUnlink(provider);
      await refreshSession();
      showToast(`${getSocialProviderLabel(provider)} 소셜 연동이 해제되었습니다.`, 'success');
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
