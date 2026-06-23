import axios from 'axios';
import { assertNetworkRequestAllowed } from '@/src/lib/networkAccessGuard';
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  saveAuthTokens,
  setAccessToken,
} from '@/src/lib/tokenStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

type AuthFailureHandler = () => Promise<void> | void;
type RetryableConfig = {
  _retry?: boolean;
  headers?: Record<string, unknown>;
  url?: string;
};

let refreshPromise: Promise<string | null> | null = null;
let authFailureHandler: AuthFailureHandler | null = null;

function isAuthRoute(url?: string) {
  return Boolean(
    url &&
      (
        url.includes('/auth/login') ||
        url.includes('/auth/refresh') ||
        url.includes('/auth/logout') ||
        url.includes('/auth/social/')
      ),
  );
}

async function handleAuthFailure() {
  // refresh가 완전히 실패하면 로컬 토큰과 인증 상태를 함께 초기화한다.
  await clearAuthTokens();
  await authFailureHandler?.();
}

export function setAuthFailureHandler(handler: AuthFailureHandler | null) {
  authFailureHandler = handler;
}

export async function refreshAccessToken() {
  // 동시에 여러 요청이 401을 받아도 refresh는 한 번만 보내고 같은 결과를 공유한다.
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      await handleAuthFailure();
      return null;
    }

    await assertNetworkRequestAllowed();

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      );



      const nextAccessToken = response.data?.access_token;
      const nextRefreshToken = response.data?.refresh_token;

      if (typeof nextAccessToken !== 'string' || typeof nextRefreshToken !== 'string') {
        await handleAuthFailure();
        return null;
      }

      await saveAuthTokens(nextAccessToken, nextRefreshToken);
      setAccessToken(nextAccessToken);
      return nextAccessToken;
    } catch (error) {
      await handleAuthFailure();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.request.use(async (config) => {
  // 셀룰러 데이터 사용 설정이 꺼진 상태에서 모바일 데이터 요청을 하지 않도록 공통 차단한다.
  await assertNetworkRequestAllowed();

  const token = getAccessToken();

  config.headers = config.headers ?? {};

  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  // FormData 업로드일 때는 Content-Type을 직접 지정하지 않아야 boundary가 자동으로 붙는다.
  if (config.data instanceof FormData) {
    if (typeof (config.headers as any).delete === 'function') {
      config.headers.set('Content-Type', null);
    } else {
      delete (config.headers as any)['Content-Type'];
    }
  } else {
    // 일반 JSON 요청은 application/json으로 고정한다.
    (config.headers as any)['Content-Type'] = 'application/json';
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = (error?.config ?? {}) as RetryableConfig;
    const status = error?.response?.status;

    if (
      status !== 401 ||
      originalConfig._retry ||
      isAuthRoute(originalConfig.url)
    ) {
      return Promise.reject(error);
    }

    originalConfig._retry = true;

    const nextAccessToken = await refreshAccessToken();
    if (!nextAccessToken) {
      return Promise.reject(error);
    }

    originalConfig.headers = originalConfig.headers ?? {};
    originalConfig.headers.Authorization = `Bearer ${nextAccessToken}`;

    return api(originalConfig as any);
  },
);

export default api;
