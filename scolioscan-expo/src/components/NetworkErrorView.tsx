import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Colors } from '@/src/constants/theme';
import { textFont } from '@/src/constants/fonts';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import NotNetworkIcon from '@/assets/icons/wifi-off.svg'
type NetworkErrorViewProps = {
  onRetry: () => void;
  title?: string;
  message?: string;
  buttonTitle?: string;
  style?: ViewStyle;
};



export default function NetworkErrorView({
  onRetry,
  title = '네트워크 연결이 끊겼어요',
  message = '네트워크 연결이 불안정해 데이터를 불러오지 못했어요',
  buttonTitle = '다시 불러오기',
  style,
}: NetworkErrorViewProps) {
  return (
    <View style={[styles.container, style]}>
        <NotNetworkIcon  />
      <View style={styles.content}>
      
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {/* 네트워크가 복구된 뒤 각 화면의 데이터 재요청 함수를 실행한다. */}
        <PrimaryButton
          title={buttonTitle}
          onPress={onRetry}
          width={120}
          height={42}
          backgroundColor={Colors.primary[500]}
          borderRadius={8}
          textStyle={styles.buttonText}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray[25],
    paddingHorizontal: 24,
  },

  content: {
    alignItems: 'center',
    marginTop :30
  },
  title: {
    ...textFont,
    marginTop: 18,
    color: Colors.gray[900],
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
  message: {
    ...textFont,
    marginTop: 14,
    color: Colors.gray[500],
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    textAlign: 'center',
  },
  button: {
    marginTop: 40,
  },
  buttonText: {
    ...textFont,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});
