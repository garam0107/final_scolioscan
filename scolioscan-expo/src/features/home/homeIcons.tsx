import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SvgProps } from 'react-native-svg';



type SvgComponent = React.ComponentType<SvgProps>;

function Layer({
  component: Component,
  style,
  innerStyle,
  blendMultiply,
}: {
  component: SvgComponent;
  style: object;
  innerStyle?: object;
  blendMultiply?: boolean;
}) {
  return (
    <View style={[styles.layer, style]}>
      <View style={innerStyle}>
        <Component
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          style={blendMultiply ? ({ mixBlendMode: 'multiply' } as any) : undefined}
        />
      </View>
    </View>
  );
}




export function HomeNotificationIcon({ unread }: { unread: boolean }) {
  return (
    <View style={styles.notificationRoot}>
      <Ionicons name="notifications-outline" size={28} color="#6E7685" />
      {unread ? <View style={styles.notificationBadge} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  iconRoot: {
    width: 60,
    height: 60,
    position: 'relative',
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
  },
  notificationRoot: {
    width: 32,
    height: 32,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  notificationBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EA4B57',
    borderWidth: 1.25,
    borderColor: '#FFFFFF',
  },
});
