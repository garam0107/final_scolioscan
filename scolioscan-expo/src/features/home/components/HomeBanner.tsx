import { Platform, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { useAds } from '@/src/contexts/AdsContext';
import {
  BannerAd,
  BannerAdSize,
} from 'react-native-google-mobile-ads';

type HomeBannerProps = {
  width: number;
  height: number;
};

const AD_ID = Platform.select({
  android: 'ca-app-pub-3142664726693803/5115591269',
  ios: 'ca-app-pub-3142664726693803/3802509592',
})!;

const styles = StyleSheet.create({
  loadedAdWrap: {
    marginTop: 16,
  },
});

export default function HomeBanner({ width, height }: HomeBannerProps) {
  const { isAdsReady } = useAds();
  const [hasLoadedAd, setHasLoadedAd] = useState(false);

  if (!isAdsReady) {
    return null;
  }

  return (
    <View style={hasLoadedAd ? styles.loadedAdWrap : undefined}>
      <BannerAd
        unitId={AD_ID}
        size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
        width={width}
        maxHeight={height}
        onAdLoaded={() => {
          // 광고가 실제로 화면에 준비된 이후에만 위아래 여백을 표시한다.
          setHasLoadedAd(true);
        }}
        onAdFailedToLoad={(error) => {
          setHasLoadedAd(false);
          console.warn('[admob] 홈 테스트 배너 로드 실패', error);
        }}
      />
    </View>
  );
}
