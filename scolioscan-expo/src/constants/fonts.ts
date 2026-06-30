export const FontFamily = {
  pretendard: 'Pretendard',
} as const;

// 글자를 렌더링하는 style에서 Pretendard weight 매핑을 안정적으로 사용하기 위한 공통 폰트 설정이다.
export const textFont = {
  fontFamily: FontFamily.pretendard,
} as const;
