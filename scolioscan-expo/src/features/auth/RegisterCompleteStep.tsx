import { Text, View } from 'react-native';
import { styles } from './register.styles';

export default function RegisterCompleteStep() {
  return (
    <View style={styles.completeWrap}>
      <Text style={styles.completeTitle}>
        축하합니다!{'\n'}이제 ScolioScan을 사용할{'\n'}준비가 되었어요
      </Text>
    </View>
  );
}
