import { StyleSheet } from 'react-native';

import { textFont } from '@/src/constants/fonts';
import { Colors } from '@/src/constants/theme';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary.white,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  copy: {
    // 작은 화면에서는 버튼 폭을 유지하고 문구 영역만 자연스럽게 줄바꿈한다.
    flex: 1,
    minWidth: 0,
    gap: 8,
    paddingVertical: 15,
  },
  title: {
    ...textFont,
    color: Colors.primary.black,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  description: {
    ...textFont,
    color: Colors.gray[500],
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
  },
  button: {
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: Colors.primary[500],
    borderRadius: 6,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    ...textFont,
    color: Colors.primary.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default styles;
