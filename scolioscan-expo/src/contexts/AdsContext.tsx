import { createContext, type ReactNode, useContext } from 'react';

type AdsContextValue = {
  isAdsReady: boolean;
};

type AdsProviderProps = AdsContextValue & {
  children: ReactNode;
};

// 광고 SDK 초기화가 끝난 뒤에만 광고 컴포넌트가 요청을 시작하도록 상태를 공유한다.
const AdsContext = createContext<AdsContextValue | null>(null);

export function AdsProvider({ children, isAdsReady }: AdsProviderProps) {
  return (
    <AdsContext.Provider value={{ isAdsReady }}>
      {children}
    </AdsContext.Provider>
  );
}

export function useAds() {
  const context = useContext(AdsContext);

  if (!context) {
    throw new Error('AdsProvider 내부에서만 useAds를 사용할 수 있습니다.');
  }

  return context;
}
