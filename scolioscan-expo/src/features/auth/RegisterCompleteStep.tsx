import { i18n } from '@/src/i18n';
import { Image, Text, View } from 'react-native';
import { styles } from './register.styles';

export default function RegisterCompleteStep() {
  return (
    <View style={styles.completeWrap}>
      <Text style={styles.completeTitle}>{i18n.t("축하합니다!")}{'\n'}{i18n.t("이제 ScolioScan을 사용할")}{'\n'}{i18n.t("준비가 되었어요!")}</Text>
    <Image
      source={require('../../../assets/gifs/register_success.gif')}
      resizeMode="contain"
      style = {styles.completeGif}
    />
    </View>
  );
}

