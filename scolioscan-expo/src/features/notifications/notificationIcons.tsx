import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import AlarmMeasurementIcon from '../../../assets/icons/Alarm/IconMeasurement.svg';
import AlarmOtherIcon from '../../../assets/icons/Alarm/IconOther.svg';
import AlarmShoppingIcon from '../../../assets/icons/Alarm/IconShopping.svg';

type AlarmIconProps = {
  size?: number;
};

function AlarmIcon({
  Icon,
  size = 24,
}: AlarmIconProps & {
  Icon: React.ComponentType<SvgProps>;
}) {
  return (
    <View style={[styles.iconRoot, { width: size, height: size }]}>
      <Icon width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />
    </View>
  );
}

export function AlarmMeasurementBadge() {
  return <AlarmIcon Icon={AlarmMeasurementIcon} />;
}

export function AlarmShoppingBadge() {
  return <AlarmIcon Icon={AlarmShoppingIcon} />;
}

export function AlarmOtherBadge() {
  return <AlarmIcon Icon={AlarmOtherIcon} />;
}

const styles = StyleSheet.create({
  iconRoot: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
