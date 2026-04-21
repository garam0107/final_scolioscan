import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SvgProps } from 'react-native-svg';

import Icon2DGroup from '../../../assets/home/Icon2D_Group.svg';
import Icon2DVector1 from '../../../assets/home/Icon2D_Vector1.svg';
import Icon2DVector2 from '../../../assets/home/Icon2D_Vector2.svg';
import Icon2DVector3 from '../../../assets/home/Icon2D_Vector3.svg';
import Icon2DVector4 from '../../../assets/home/Icon2D_Vector4.svg';
import Icon2DVector5 from '../../../assets/home/Icon2D_Vector5.svg';
import Icon2DVector6 from '../../../assets/home/Icon2D_Vector6.svg';
import Icon2DVector7 from '../../../assets/home/Icon2D_Vector7.svg';
import Icon3D1 from '../../../assets/home/Icon3D_1.svg';
import Icon3D2 from '../../../assets/home/Icon3D_2.svg';
import Icon3D3 from '../../../assets/home/Icon3D_3.svg';
import Icon3D4 from '../../../assets/home/Icon3D_4.svg';
import Icon3D5 from '../../../assets/home/Icon3D_5.svg';
import Icon3D6 from '../../../assets/home/Icon3D_6.svg';
import Icon3D7 from '../../../assets/home/Icon3D_7.svg';
import Icon3D8 from '../../../assets/home/Icon3D_8.svg';
import Icon3D9 from '../../../assets/home/Icon3D_9.svg';
import Icon3D10 from '../../../assets/home/Icon3D_10.svg';
import Icon3D11 from '../../../assets/home/Icon3D_11.svg';
import Icon3D12 from '../../../assets/home/Icon3D_12.svg';
import IconScoliometer1 from '../../../assets/home/IconScoliometer_1.svg';
import IconScoliometer2 from '../../../assets/home/IconScoliometer_2.svg';

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

export function HomeMeasurement2DIcon() {
  return (
    <View style={styles.iconRoot}>
      <Layer component={Icon2DVector1} style={{ left: '21.93%', right: '69.35%', top: '25.19%', bottom: '67.6%' }} />
      <Layer component={Icon2DVector2} style={{ left: '14.83%', right: '14.83%', top: '22%', bottom: '22.23%' }} />
      <Layer component={Icon2DVector3} style={{ left: '72.12%', right: '20.85%', top: '35.38%', bottom: '57.58%' }} innerStyle={{ position: 'absolute', top: '-32.77%', right: '-32.77%', bottom: '-32.77%', left: '-32.77%' }} />
      <Layer component={Icon2DVector4} blendMultiply style={{ left: '14.83%', right: '53.03%', top: '22%', bottom: '22.23%' }} />
      <Layer component={Icon2DVector5} style={{ left: '32.08%', right: '50%', top: '36.46%', bottom: '27.69%' }} />
      <Layer component={Icon2DVector6} style={{ left: '32.08%', right: '32.08%', top: '36.46%', bottom: '27.69%' }} />
      <Layer component={Icon2DVector7} style={{ left: '38.32%', right: '38.35%', top: '42.72%', bottom: '33.95%' }} />
      <Layer component={Icon2DGroup} blendMultiply style={{ left: '28.93%', right: '35.44%', top: '39.01%', bottom: '25.36%' }} innerStyle={{ position: 'absolute', top: '-2.16%', right: '-2.16%', bottom: '-2.15%', left: '-2.16%' }} />
    </View>
  );
}

export function HomeMeasurement3DIcon() {
  return (
    <View style={styles.iconRoot}>
      <Layer component={Icon3D1} style={{ left: '8.96%', right: '5%', top: '39.35%', bottom: '15.9%' }} />
      <Layer component={Icon3D2} style={{ left: '27.2%', right: '52.07%', top: '18.33%', bottom: '60.94%' }} />
      <Layer component={Icon3D3} blendMultiply style={{ left: '27.2%', right: '55.36%', top: '19.25%', bottom: '60.94%' }} />
      <Layer component={Icon3D4} style={{ left: '47.9%', right: '25.61%', top: '12.57%', bottom: '60.94%' }} />
      <Layer component={Icon3D5} blendMultiply style={{ left: '34.92%', right: '29.81%', top: '13.74%', bottom: '15.9%' }} />
      <Layer component={Icon3D6} style={{ left: '21.38%', right: '27.11%', top: '39.04%', bottom: '26.65%' }} />
      <Layer component={Icon3D7} blendMultiply style={{ left: '21.38%', right: '27.11%', top: '39.04%', bottom: '26.65%' }} />
      <Layer component={Icon3D8} style={{ left: '33.33%', right: '58.21%', top: '24.47%', bottom: '67.08%' }} />
      <Layer component={Icon3D9} style={{ left: '55%', right: '32.71%', top: '19.67%', bottom: '68.04%' }} />
      <Layer component={Icon3D10} style={{ left: '50.8%', right: '34.29%', top: '46.26%', bottom: '38.82%' }} />
      <Layer component={Icon3D11} blendMultiply style={{ left: '50.8%', right: '45.47%', top: '46.26%', bottom: '38.82%' }} />
      <Layer component={Icon3D12} blendMultiply style={{ left: '72.89%', right: '5%', top: '46.76%', bottom: '26.96%' }} />
    </View>
  );
}

export function HomeSpineIcon() {
  return (
    <View style={styles.iconRoot}>
      <View style={[styles.layer, { left: '23.73%', right: '9.41%', top: '3.45%', bottom: '5.74%', transform: [{ rotate: '180deg' }, { scaleY: -1 }] }]}>
        <IconScoliometer1 width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />
      </View>
      <View style={[styles.layer, { left: '30.7%', width: '10.672%', top: '2.07%', height: '90.815%', transform: [{ rotate: '180deg' }, { scaleY: -1 }] }]}>
        <IconScoliometer2 width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />
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
