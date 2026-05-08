import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/src/constants/theme';

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
    backgroundColor: Colors.primary[500],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  guideText: {
    color: Colors.primary['white'],
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
