import { Image, StyleSheet, Text, View } from 'react-native';

const defaultSteps = [
  '[동의 및 휴대전화 번호 확인] 버튼을 누르세요.',
  '메시지 보내기 창에 번호 확인을 위한 인증 메시지가 자동으로 입력됩니다.',
  '인증 메시지를 수정 없이 그대로 보내주세요. 발신번호가 휴대전화 번호 확인에 이용됩니다.',
];

type SmsVerificationGuideProps = {
  steps?: string[];
};

export default function SmsVerificationGuide({ steps = defaultSteps }: SmsVerificationGuideProps) {
  return (
    <View style={styles.messageWrap}>
      <View style={styles.messageGuideList}>
        {steps.map((text, index) => (
          <View key={text} style={styles.messageGuideRow}>
            <View style={styles.messageGuideNumber}>
              <Text style={styles.messageGuideNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.messageGuideText}>{text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.messagePreviewWrap}>
        <Image
          resizeMode="contain"
          source={require('../../assets/images/register_message.png')}
          style={styles.messagePreviewImage}
        />
      </View>

      <Text style={styles.messageFootnote}>
        • 이용 중인 통신 요금제에 따라 문자 메시지 발송 비용이 청구될 수 있습니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  messageWrap: {
    flex: 1,
  },
  messageGuideList: {
    gap: 14,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  messageGuideRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  messageGuideNumber: {
    alignItems: 'center',
    backgroundColor: '#657085',
    borderRadius: 999,
    height: 22,
    justifyContent: 'center',
    marginTop: 1,
    width: 22,
  },
  messageGuideNumberText: {
    color: '#FFFFFF',
    fontFamily: 'PretendardVariable',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  messageGuideText: {
    color: '#000000',
    flex: 1,
    fontFamily: 'PretendardVariable',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
  },
  messagePreviewWrap: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  messagePreviewImage: {
    height: 186,
    width: '100%',
  },
  messageFootnote: {
    color: '#97A2B9',
    fontFamily: 'PretendardVariable',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 24,
    textAlign: 'center',
  },
});
