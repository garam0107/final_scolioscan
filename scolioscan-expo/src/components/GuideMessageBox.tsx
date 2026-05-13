import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/src/constants/theme';
import { textFont } from '@/src/constants/fonts';

type GuideMessageBoxProps = {
  messages: string[];
};

export default function GuideMessageBox({ messages }: GuideMessageBoxProps) {
  // 여러 안내 문구를 같은 박스 스타일로 묶어 입력 화면에서 재사용한다.
  return (
    <View style={styles.guideBox}>
      {messages.map((message) => (
        <Text key={message} style={styles.guideText}>
          {message}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  guideBox: {
    backgroundColor: Colors.mint[25],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  guideText: {
    ...textFont,
    color: Colors.primary[500],
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
