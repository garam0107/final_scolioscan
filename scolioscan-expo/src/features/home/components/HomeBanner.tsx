import { Text, View } from 'react-native';
import styles from '@/src/features/home/styles/homeBanner.styles';

type HomeBannerProps = {
  width: number;
  height: number;
};

export default function HomeBanner({ width, height }: HomeBannerProps) {
  return (
    <View style={styles.bannerWrap}>
      <View style={[styles.bannerPager, { width, height }]}>
        <View style={[styles.banner, { width, height }]}>
          <Text style={styles.bannerPlaceholderText}>광고 준비중</Text>
        </View>
      </View>
    </View>
  );
}
