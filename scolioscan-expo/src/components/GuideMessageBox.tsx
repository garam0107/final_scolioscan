import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/src/constants/theme';
import { textFont } from '@/src/constants/fonts';

type GuideMessageBoxProps = {
  messages: string[];
};

export default function GuideMessageBox({ messages }: GuideMessageBoxProps) {
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
