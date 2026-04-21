import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, G, Mask, Path, Rect } from 'react-native-svg';

import CameraGuideline from '../../../../assets/images/camera_guideline.svg';

const GUIDE_PATH =
  'M48.998 585.5C48.998 525 37.9909 446.42 37.9909 446.42C32.3512 445.777 34.9595 445.906 28.4739 445.135C20.3668 444.17 13.3172 434.848 10.8494 422.632C8.87517 412.859 10.0268 394.129 10.8494 385.985C10.8494 385.985 4.14554 332.621 3.79976 272.829C3.45398 213.036 -3.09736 172.21 16.8421 154.208C32.0083 140.515 57.166 136.06 74.7902 126.562C82.5448 122.383 91.5467 118.847 92.9567 114.668C94.5401 109.974 94.7912 104.216 93.8708 98.2487C93.3749 95.034 85.9263 91.1765 84.1638 84.7471C82.6658 79.2822 78.1251 69.0194 78.1251 48.767C78.1251 28.5147 80.639 2.5 118.498 2.5C156.357 2.5 158.871 28.5147 158.871 48.767C158.871 69.0194 154.33 79.2822 152.832 84.7471C151.07 91.1765 143.621 95.034 143.125 98.2487C142.205 104.216 142.456 109.974 144.039 114.668C145.449 118.847 154.451 122.383 162.206 126.562C179.83 136.06 204.988 140.515 220.154 154.208C240.093 172.21 233.542 213.036 233.196 272.829C232.851 332.621 226.147 385.985 226.147 385.985C226.969 394.129 228.121 412.859 226.147 422.632C223.679 434.848 216.629 444.17 208.522 445.135C202.037 445.906 204.645 445.777 199.005 446.42C199.005 446.42 191.998 535.5 189.498 585.5';
const BASE_W = 237;
const BASE_H = 588;

type CameraGuidelineOverlayProps = {
  width: number;
  height: number;
};

export function CameraGuidelineOverlay({ width, height }: CameraGuidelineOverlayProps) {
  const guideWidth = width * 0.62;
  const guideHeight = guideWidth * (BASE_H / BASE_W);
  const guideX = (width - guideWidth) / 2;
  const guideY = height - guideHeight;

  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width, height }} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <Mask
            id="camera-cutout"
            x="0"
            y="0"
            width={width}
            height={height}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
          >
            <Rect x="0" y="0" width={width} height={height} fill="white" />
            <G transform={`translate(${guideX}, ${guideY}) scale(${guideWidth / BASE_W}, ${guideHeight / BASE_H})`}>
              <Path d={GUIDE_PATH} fill="black" />
            </G>
          </Mask>
        </Defs>

        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          // dimmed 수치 수정예정
          fill="rgba(59, 64, 73, 0.25)"
          mask="url(#camera-cutout)"
        />
      </Svg>

      <View style={{ position: 'absolute', left: guideX, top: guideY, width: guideWidth, height: guideHeight }}>
        <CameraGuideline width="100%" height="100%" />
      </View>
    </View>
  );
}
