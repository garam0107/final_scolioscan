import { useFocusEffect } from '@react-navigation/native';
import { PropsWithChildren, useCallback, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export default function TabFocusTransition({ children }: PropsWithChildren) {
  const translateX = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      translateX.setValue(18);

      Animated.timing(translateX, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, [translateX]),
  );

  return (
    <Animated.View style={{ flex: 1, transform: [{ translateX }] }}>
      {children}
    </Animated.View>
  );
}
