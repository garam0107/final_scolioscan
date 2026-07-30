import { Platform, View } from 'react-native';
import { useAds } from '@/src/contexts/AdsContext';
import {
  BannerAd,
  BannerAdSize,
} from 'react-native-google-mobile-ads';
import styles from '@/src/features/home/styles/homeBanner.styles';

type HomeBannerProps = {
  width: number;
  height: number;
};

const AD_ID = Platform.select({
  android: 'ca-app-pub-3142664726693803/5115591269',
  ios: 'ca-app-pub-3142664726693803/3802509592',
})!;
export default function HomeBanner({ width, height }: HomeBannerProps) {
  const { isAdsReady } = useAds();

  return (
    <View style={styles.bannerWrap}>
      <View style={[styles.bannerPager, { width, height }]}>
        <View style={[styles.banner, { width, height }]}>
          {isAdsReady ? (
            <BannerAd
              unitId={AD_ID}
              size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
              width={width}
              maxHeight={height}
              onAdFailedToLoad={(error) => {
                console.warn('[admob] 홈 테스트 배너 로드 실패', error);
              }}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}
