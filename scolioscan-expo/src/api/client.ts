import axios from 'axios';
import { getAccessToken } from '@/src/lib/tokenStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  config.headers = config.headers ?? {};

  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  // FormData 업로드일 때는 Content-Type을 직접 지정하지 않아야
  // axios가 boundary를 포함한 multipart/form-data를 자동으로 붙입니다.
  if (config.data instanceof FormData) {
    if (typeof (config.headers as any).delete === 'function') {
      (config.headers as any).delete('Content-Type');
    } else {
      delete (config.headers as any)['Content-Type'];
      delete (config.headers as any)['content-type'];
    }
  } else {
    // 일반 JSON 요청은 application/json
    (config.headers as any)['Content-Type'] = 'application/json';
  }

  return config;
});

export default api;
