export type SocialLoginMethod = {
  provider: 'google' | 'naver' | 'kakao';
  email?: string | null;
  isLinked: boolean;
  onPress?: () => void;
};
