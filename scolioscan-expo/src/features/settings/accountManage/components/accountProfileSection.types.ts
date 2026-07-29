export type SocialLoginMethod = {
  provider: 'google' | 'naver' | 'kakao' | 'apple';
  email?: string | null;
  isLinked: boolean;
  onPress?: () => void;
};
