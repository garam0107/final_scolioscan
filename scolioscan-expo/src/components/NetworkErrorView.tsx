import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Colors } from '@/src/constants/theme';
import { textFont } from '@/src/constants/fonts';
import PrimaryButton from '@/src/components/ui/PrimaryButton';

type NetworkErrorViewProps = {
  onRetry: () => void;
  title?: string;
  message?: string;
  buttonTitle?: string;
  style?: ViewStyle;
};

function DisconnectedWifiIcon() {
  return (
    <Svg width={70} height={70} viewBox="0 0 70 70" fill="none">
      <Path
        d="M16 29.5C26.5 20.5 43.5 20.5 54 29.5"
        stroke="#D4D9E2"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Path
        d="M25 39C31 34 39 34 45 39"
        stroke="#D4D9E2"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Path
        d="M31.5 48C33.7 46.2 36.3 46.2 38.5 48"
        stroke="#D4D9E2"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Circle cx={35} cy={56} r={3.2} fill="#D4D9E2" />
      <Line
        x1={50.2}
        y1={20.8}
        x2={19.8}
        y2={51.2}
        stroke="#FF4747"
        strokeWidth={5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function NetworkErrorView({
  onRetry,
  title = '네트워크 연결이 끊겼어요',
  message = '네트워크 연결이 불안정해 데이터를 불러오지 못했어요',
  buttonTitle = '다시 불러오기',
  style,
}: NetworkErrorViewProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <DisconnectedWifiIcon />
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
    justifyContent: 'center',
    transform: [{ translateY: -24 }],
  },
  title: {
    ...textFont,
    marginTop: 18,
    color: Colors.gray[900],
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    ...textFont,
    marginTop: 12,
    color: Colors.gray[500],
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    textAlign: 'center',
  },
  button: {
    marginTop: 22,
  },
  buttonText: {
    ...textFont,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});
