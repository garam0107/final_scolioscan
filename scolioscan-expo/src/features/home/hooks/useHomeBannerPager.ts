import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

const AD_PLACEHOLDER_SLIDES = ['ad-1', 'ad-2', 'ad-3'];

export function useHomeBannerPager(width: number) {
  const bannerScrollRef = useRef<ScrollView>(null);
  const [, setBannerIndex] = useState(0);
  const isCompactWidth = width < 390;
  const bannerHeight = isCompactWidth ? 104 : 112;
  const bannerWidth = width - 40;
  const banners = useMemo(() => AD_PLACEHOLDER_SLIDES, []);

  const handleBannerMomentumEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / bannerWidth);
    if (nextIndex >= banners.length) {
      bannerScrollRef.current?.scrollTo({ x: 0, animated: false });
      setBannerIndex(0);
      return;
    }

    setBannerIndex(Math.max(0, Math.min(nextIndex, banners.length - 1)));
  }, [bannerWidth, banners.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((value) => {
        // 마지막 복제 배너까지 이동한 뒤 첫 배너로 되돌려 무한 캐러셀처럼 보이게 한다.
        const isLastBanner = value === banners.length - 1;
        const nextIndex = isLastBanner ? banners.length : value + 1;
        bannerScrollRef.current?.scrollTo({
          x: nextIndex * bannerWidth,
          animated: true,
        });

        if (isLastBanner) {
          setTimeout(() => {
            bannerScrollRef.current?.scrollTo({ x: 0, animated: false });
          }, 450);
          return 0;
        }

        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [bannerWidth, banners.length]);

  return {
    bannerScrollRef,
    banners,
    bannerHeight,
    bannerWidth,
    handleBannerMomentumEnd,
  };
}
