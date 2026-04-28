import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI } from '@/src/api/auth';
import { userAPI } from '@/src/api/user';
import { clearAccessToken, loadAccessToken, saveAccessToken, setAccessToken } from '@/src/lib/tokenStorage';
import type { LoginRequest, RegisterRequest } from '@/src/types/auth';
import type { UserResponse } from '@/src/types/user';

type AuthContextValue = {
  user: UserResponse | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  checkEmail: (email: string) => Promise<boolean>;
  checkPhone: (phone: string) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeApiError(error: unknown) {
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const storedToken = await loadAccessToken();
      setAccessToken(storedToken);
      setAccessTokenState(storedToken);

      if (!storedToken) {
        setUser(null);
        return;
      }

      const response = await userAPI.getCurrentUser();
      setUser(response.data);
    } catch {
      await clearAccessToken();
      setAccessToken(null);
      setAccessTokenState(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      const response = await authAPI.login(credentials);
      const token = response.data.access_token;
      await saveAccessToken(token);
      setAccessToken(token);
      setAccessTokenState(token);

      const userResponse = await userAPI.getCurrentUser();
      setUser(userResponse.data);
    } catch (error) {
      await clearAccessToken();
      setAccessToken(null);
      setAccessTokenState(null);
      setUser(null);
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

  const register = useCallback(async (data: RegisterRequest) => {
    try {
      await authAPI.register(data);
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  }, []);

  const logout = useCallback(async () => {
    await clearAccessToken();
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      loading,
      isAuthenticated: Boolean(user && accessToken),
      login,
      checkEmail,
      checkPhone,
      register,
      logout,
      refreshSession,
    }),
    [user, accessToken, loading, login, checkEmail,checkPhone, register, logout, refreshSession]
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
