import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI } from '@/src/api/auth';
import { refreshAccessToken, setAuthFailureHandler } from '@/src/api/client';
import { userAPI } from '@/src/api/user';
import {
  clearAuthTokens,
  getOrCreateDeviceId,
  loadAccessToken,
  loadRefreshToken,
  saveAuthTokens,
  setAccessToken,
  setRefreshToken,
} from '@/src/lib/tokenStorage';
import { useAppSettingsStore } from '@/src/store/appSettingsStore';
import { useMeasurementGuideStore } from '@/src/store/measurementGuideStore';
import { useReportMeasurementListFilterStore } from '@/src/store/reportMeasurementListFilterStore';
import { getCurrentDeviceLabel } from '@/src/features/settings/accountManage/accountManageUtils';
import type {
  LoginRequest,
  RegisterRequest,
  MessagCodeResponse,
  OctomoApiResponse,
  SocialAuthResponse,
  SocialLinkExistingRequest,
  SocialSignupRequest,
} from '@/src/types/auth';
import type { UserResponse } from '@/src/types/user';

type AuthContextValue = {
  user: UserResponse | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: Omit<LoginRequest, 'device_id' | 'device_name'>) => Promise<void>;
  verifyGoogleSocialLogin: (idToken: string) => Promise<SocialAuthResponse>;
  verifyKakaoSocialLogin: (accessToken: string) => Promise<SocialAuthResponse>;
  verifyNaverSocialLogin: (accessToken: string) => Promise<SocialAuthResponse>;
  linkSocialAccount: (payload: Omit<SocialLinkExistingRequest, 'device_id' | 'device_name'>) => Promise<void>;
  signupWithSocialAccount: (payload: Omit<SocialSignupRequest, 'device_id' | 'device_name'>) => Promise<void>;
  checkEmail: (email: string) => Promise<boolean>;
  checkPhone: (phone: string) => Promise<boolean>;
  messageCode: (phone: string) => Promise<MessagCodeResponse>;
  octomoApi: (phone: string) => Promise<OctomoApiResponse>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeApiError(error: unknown) {
  // API 오류 형태를 화면에서 바로 쓸 수 있는 문구로 통일한다.
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    const detail = response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return '요청 처리 중 오류가 발생했습니다.';
}

function getApiStatus(error: unknown) {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }

  const response = (error as { response?: { status?: number } }).response;
  return response?.status;
}

function isAuthExpiredError(error: unknown) {
  const status = getApiStatus(error);
  return status === 401 || status === 403;
}

async function loadUserScopedLocalState(userId: string) {
  // 사용자별 로컬 상태를 로그인한 계정 기준으로 다시 불러온다.
  const results = await Promise.allSettled([
    useAppSettingsStore.getState().loadSettings(userId),
    useReportMeasurementListFilterStore.getState().setCurrentUserId(userId),
    useMeasurementGuideStore.getState().setCurrentUserId(userId),
  ]);

  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.log('[auth] 사용자별 로컬 상태 로딩 실패', result.reason);
    }
  });
}

function resetUserScopedLocalState() {
  // 로그아웃 뒤 이전 사용자의 로컬 상태가 남지 않도록 메모리 상태를 초기화한다.
  useAppSettingsStore.getState().resetSettingsState();
  useReportMeasurementListFilterStore.getState().resetCurrentUserState();
  useMeasurementGuideStore.getState().resetCurrentUserState();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuthState = useCallback(async () => {
    // 세션 종료 시 토큰과 사용자 상태를 같은 타이밍에 함께 비운다.
    await clearAuthTokens();
    setAccessToken(null);
    setRefreshToken(null);
    setAccessTokenState(null);
    setUser(null);
    resetUserScopedLocalState();
  }, []);

  const hydrateCurrentUser = useCallback(async () => {
    // 현재 access token으로 사용자 정보를 다시 받아 전역 인증 상태를 맞춘다.
    const userResponse = await userAPI.getCurrentUser();
    await loadUserScopedLocalState(userResponse.data.id);
    setUser(userResponse.data);
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const userResponse = await userAPI.getCurrentUser();
    setUser(userResponse.data);
  }, []);

  const applyLoginSession = useCallback(
    async (payload: { access_token: string; refresh_token: string }) => {
      // 일반 로그인과 소셜 로그인 모두 같은 토큰 저장 경로를 사용한다.
      await saveAuthTokens(payload.access_token, payload.refresh_token);
      setAccessToken(payload.access_token);
      setRefreshToken(payload.refresh_token);
      setAccessTokenState(payload.access_token);
      await hydrateCurrentUser();
    },
    [hydrateCurrentUser],
  );

  const refreshSession = useCallback(async () => {
    // 앱 시작 시 저장된 토큰으로 세션을 복구하고 필요하면 refresh를 시도한다.
    setLoading(true);
    try {
      const [storedAccessToken, storedRefreshToken] = await Promise.all([
        loadAccessToken(),
        loadRefreshToken(),
      ]);

      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setAccessTokenState(storedAccessToken);

      if (!storedAccessToken && !storedRefreshToken) {
        setUser(null);
        resetUserScopedLocalState();
        return;
      }

      try {
        await hydrateCurrentUser();
        return;
      } catch (error) {
        if (!isAuthExpiredError(error)) {
          setUser(null);
          resetUserScopedLocalState();
          return;
        }
      }

      const nextAccessToken = await refreshAccessToken();
      if (!nextAccessToken) {
        await clearAuthState();
        return;
      }

      setAccessToken(nextAccessToken);
      setAccessTokenState(nextAccessToken);
      await hydrateCurrentUser();
    } finally {
      setLoading(false);
    }
  }, [clearAuthState, hydrateCurrentUser]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    // axios 계층에서 refresh까지 실패하면 컨텍스트 상태도 함께 초기화한다.
    setAuthFailureHandler(() => {
      setAccessToken(null);
      setRefreshToken(null);
      setAccessTokenState(null);
      setUser(null);
      resetUserScopedLocalState();
    });

    return () => {
      setAuthFailureHandler(null);
    };
  }, []);

  const login = useCallback(async (credentials: Omit<LoginRequest, 'device_id' | 'device_name'>) => {
    try {
      // 백엔드가 요구하는 기기 식별값을 함께 보내 세션을 생성한다.
      const deviceId = await getOrCreateDeviceId();
      const deviceName = getCurrentDeviceLabel();
      const response = await authAPI.login({
        ...credentials,
        device_id: deviceId,
        device_name: deviceName,
      });

      await applyLoginSession(response.data);
    } catch (error) {
      await clearAuthState();
      throw new Error(normalizeApiError(error));
    }
  }, [applyLoginSession, clearAuthState]);

  const verifyGoogleSocialLogin = useCallback(async (idToken: string) => {
    try {
      // 구글 SDK가 발급한 id_token을 백엔드 검증 API로 전달한다.
      const deviceId = await getOrCreateDeviceId();
      const deviceName = getCurrentDeviceLabel();
      const response = await authAPI.verifyGoogleSocialLogin({
        id_token: idToken,
        device_id: deviceId,
        device_name: deviceName,
      });

      if (response.data.status === 'login_success') {
        await applyLoginSession(response.data);
      }

      return response.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  }, [applyLoginSession]);

  const verifyKakaoSocialLogin = useCallback(async (socialAccessToken: string) => {
    try {
      
      // 카카오 SDK access token을 백엔드에 넘겨 검증과 계정 분기를 통합한다.
      const deviceId = await getOrCreateDeviceId();
      const deviceName = getCurrentDeviceLabel();

      const response = await authAPI.verifyKakaoSocialLogin({
        access_token: socialAccessToken,
        device_id: deviceId,
        device_name: deviceName,
      });
      
      if (response.data.status === 'login_success') {
        await applyLoginSession(response.data);
      }

      return response.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  }, [applyLoginSession]);

  const verifyNaverSocialLogin = useCallback(async (socialAccessToken: string) => {
    try {
      // 네이버 SDK access token을 백엔드에 넘겨 검증과 계정 분기를 통합한다.
      const deviceId = await getOrCreateDeviceId();
      const deviceName = getCurrentDeviceLabel();
      const response = await authAPI.verifyNaverSocialLogin({
        access_token: socialAccessToken,
        device_id: deviceId,
        device_name: deviceName,
      });
      console.log('[auth][naver] verify response =', response);
      console.log('[auth][naver] http status =', response.status);
      console.log('[auth][naver] api status =', response.data.status);
      console.log('[auth][naver] social temp token =', response.data.social_temp_token);
      console.log('[auth][naver] app access token =', response.data.access_token);
      if (response.data.status === 'login_success') {
        await applyLoginSession(response.data);
      }
      if (response.data.status === 'need_account_decision') {
      console.log('[auth][naver] branch = need_account_decision');
      }
      return response.data;
    } catch (error) {
      console.log('[auth][naver] verify error raw =', error);
      console.log(
      '[auth][naver] verify error message =',
      error instanceof Error ? error.message : String(error)
    );
      throw new Error(normalizeApiError(error));
    }
  }, [applyLoginSession]);

  const linkSocialAccount = useCallback(async (payload: Omit<SocialLinkExistingRequest, 'device_id' | 'device_name'>) => {
    try {
      // 기존 계정 연결도 최종적으로는 로그인 응답을 돌려주므로 같은 세션 저장 로직을 쓴다.
      const deviceId = await getOrCreateDeviceId();
      const deviceName = getCurrentDeviceLabel();
      const response = await authAPI.linkExistingSocialAccount({
        ...payload,
        device_id: deviceId,
        device_name: deviceName,
      });

      await applyLoginSession(response.data);
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  }, [applyLoginSession]);

  const signupWithSocialAccount = useCallback(async (payload: Omit<SocialSignupRequest, 'device_id' | 'device_name'>) => {
    try {
      // 소셜 회원가입 성공 시 백엔드가 돌려준 로그인 응답으로 곧바로 세션을 완성한다.
      const deviceId = await getOrCreateDeviceId();
      const deviceName = getCurrentDeviceLabel();
      const response = await authAPI.signupWithSocialAccount({
        ...payload,
        device_id: deviceId,
        device_name: deviceName,
      });

      await applyLoginSession(response.data);
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  }, [applyLoginSession]);

  const checkEmail = useCallback(async (email: string) => {
    try {
      const response = await authAPI.checkEmail(email);
      return response.data.exists;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  }, []);

  const checkPhone = useCallback(async (phone: string) => {
    try {
      const response = await authAPI.checkPhone(phone);
      return response.data.exists;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  }, []);

  const messageCode = useCallback(async (phone: string) => {
    // 문자 인증 코드는 기존 auth API를 그대로 사용한다.
    try {
      const response = await authAPI.messageCode({ phoneNumber: phone });
      return response.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  }, []);

  const octomoApi = useCallback(async (phone: string) => {
    // 문자 인증 확인도 기존 API를 그대로 사용한다.
    try {
      const response = await authAPI.octomoApi({ phoneNumber: phone });
      return response.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    try {
      await authAPI.register(data);
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  }, []);

  const logout = useCallback(async () => {
    // refresh token이 남아 있으면 revoke를 요청하고 실패해도 로컬 세션은 정리한다.
    const refreshToken = await loadRefreshToken();

    try {
      if (refreshToken) {
        await authAPI.logout({ refresh_token: refreshToken });
      }
    } catch (error) {
      console.log('[auth] 로그아웃 revoke 실패', error);
    } finally {
      await clearAuthState();
    }
  }, [clearAuthState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      loading,
      isAuthenticated: Boolean(accessToken),
      login,
      verifyGoogleSocialLogin,
      verifyKakaoSocialLogin,
      verifyNaverSocialLogin,
      linkSocialAccount,
      signupWithSocialAccount,
      checkEmail,
      checkPhone,
      messageCode,
      octomoApi,
      register,
      logout,
      refreshCurrentUser,
      refreshSession,
    }),
    [
      user,
      accessToken,
      loading,
      login,
      verifyGoogleSocialLogin,
      verifyKakaoSocialLogin,
      verifyNaverSocialLogin,
      linkSocialAccount,
      signupWithSocialAccount,
      checkEmail,
      checkPhone,
      messageCode,
      octomoApi,
      register,
      logout,
      refreshCurrentUser,
      refreshSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
