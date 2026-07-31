export type SocialLoginMethod = {
  provider: 'google' | 'naver' | 'kakao' | 'apple';
  email?: string | null;
  isLinked: boolean;
  actionLabel?: string;
  onPress?: () => void;
};
