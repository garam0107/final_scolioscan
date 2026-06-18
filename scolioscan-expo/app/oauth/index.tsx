import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    provider?: string;
    ticket?: string;
    error?: string;
    error_description?: string;
  }>();

  useEffect(() => {
    // oauth 스크린을 스택에서 제거하면서 login을 루트로 설정
    router.dismissAll();
    router.replace({
      pathname: '/login',
      params: {
        oauth_provider: params.provider ?? '',
        oauth_ticket: params.ticket ?? '',
        oauth_error: params.error ?? '',
        oauth_error_description: params.error_description ?? '',
      },
    });
  }, []);

  return null;
}