import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI } from '@/src/api/auth';
import { userAPI } from '@/src/api/user';
import { clearAccessToken, loadAccessToken, saveAccessToken, setAccessToken } from '@/src/lib/tokenStorage';
import type { LoginRequest } from '@/src/types/auth';
import type { UserResponse } from '@/src/types/user';

type AuthContextValue = {
  user: UserResponse | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
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

  const refreshSession = async () => {
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
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const login = async (credentials: LoginRequest) => {
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
  };

  const logout = async () => {
    await clearAccessToken();
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      loading,
      isAuthenticated: Boolean(user && accessToken),
      login,
      logout,
      refreshSession,
    }),
    [user, accessToken, loading]
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

