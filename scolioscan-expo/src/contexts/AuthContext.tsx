import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI } from '@/src/api/auth';
import { userAPI } from '@/src/api/user';
import { clearAccessToken, loadAccessToken, saveAccessToken, setAccessToken } from '@/src/lib/tokenStorage';
import { useAppSettingsStore } from '@/src/store/appSettingsStore';
import { useMeasurementGuideStore } from '@/src/store/measurementGuideStore';
import { useReportMeasurementListFilterStore } from '@/src/store/reportMeasurementListFilterStore';
import type { LoginRequest, RegisterRequest, MessagCodeResponse, OctomoApiResponse } from '@/src/types/auth';
import type { UserResponse } from '@/src/types/user';

type AuthContextValue = {
  user: UserResponse | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  checkEmail: (email: string) => Promise<boolean>;
  checkPhone: (phone: string) => Promise<boolean>;
  messageCode : (phone :string) => Promise<MessagCodeResponse>;
  octomoApi : (phone : string) => Promise<OctomoApiResponse>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeApiError(error: unknown) {
  // API 오류 형태를 화면에서 그대로 사용할 수 있는 메시지로 통일한다.
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
  // 사용자별 로컬 저장소를 로그인한 계정 기준으로 전환한다.
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
  // 로그아웃 후 이전 사용자의 로컬 상태가 화면에 남지 않도록 메모리만 초기화한다.
  useAppSettingsStore.getState().resetSettingsState();
  useReportMeasurementListFilterStore.getState().resetCurrentUserState();
  useMeasurementGuideStore.getState().resetCurrentUserState();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    // 앱 시작과 프로필 갱신 후 저장된 토큰으로 현재 사용자 정보를 다시 맞춘다.
    setLoading(true);
    try {
      const storedToken = await loadAccessToken();
      setAccessToken(storedToken);
      setAccessTokenState(storedToken);

      if (!storedToken) {
        setUser(null);
        resetUserScopedLocalState();
        return;
      }

      const response = await userAPI.getCurrentUser();
      await loadUserScopedLocalState(response.data.id);
      setUser(response.data);
    } catch (error) {
      if (isAuthExpiredError(error)) {
        // 서버가 명확하게 인증 실패를 응답한 경우에만 저장된 토큰을 삭제한다.
        await clearAccessToken();
        setAccessToken(null);
        setAccessTokenState(null);
        setUser(null);
        resetUserScopedLocalState();
        return;
      }

      // 네트워크 끊김이나 서버 일시 오류는 로그아웃으로 보지 않고 저장된 토큰을 유지한다.
      setUser(null);
      resetUserScopedLocalState();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      // 로그인 성공 후 토큰 저장과 사용자 조회를 한 번에 끝내 전역 인증 상태를 갱신한다.
      const response = await authAPI.login(credentials);
      const token = response.data.access_token;
      await saveAccessToken(token);
      setAccessToken(token);
      setAccessTokenState(token);

      const userResponse = await userAPI.getCurrentUser();
      await loadUserScopedLocalState(userResponse.data.id);
      setUser(userResponse.data);
    } catch (error) {
      await clearAccessToken();
      setAccessToken(null);
      setAccessTokenState(null);
      setUser(null);
      resetUserScopedLocalState();
      throw new Error(normalizeApiError(error));
    }
  }, []);

  const checkEmail = useCallback(async (email: string) => {
    try {
      const response = await authAPI.checkEmail(email);
      return response.data.exists;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  }, []);

  const checkPhone = useCallback(async (phone: string) => {
    try{
      const response = await authAPI.checkPhone(phone);
      return response.data.exists;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  }, []);


  const messageCode = useCallback(async (phone : string) => {
    // 문자 인증 앱에 전달할 수신번호와 메시지 본문을 서버에서 받아온다.
    try {
    const response = await authAPI.messageCode({ phoneNumber: phone });
    return response.data;
  } catch (error) {
    throw new Error(normalizeApiError(error));
  }
  }, []);

  const octomoApi = useCallback(async (phone : string) => {
    // 문자 발송 후 실제 인증 완료 여부를 서버에서 확인한다.
    try{
      const response = await authAPI.octomoApi({phoneNumber : phone});
      return response.data;
    }catch (error) {
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
    // 로그아웃은 저장된 토큰과 메모리의 사용자 상태를 함께 비운다.
    await clearAccessToken();
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
    resetUserScopedLocalState();
  }, []);

  const value = useMemo<AuthContextValue>(
    // 컨텍스트 값 참조를 고정해 인증 상태 변경이 있을 때만 하위 화면을 다시 렌더링한다.
    () => ({
      user,
      accessToken,
      loading,
      isAuthenticated: Boolean(accessToken),
      login,
      checkEmail,
      checkPhone,
      messageCode,
      octomoApi,
      register,
      logout,
      refreshSession,
    }),
    [user, accessToken, loading, login, checkEmail,checkPhone,messageCode, register, octomoApi, logout, refreshSession]
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
