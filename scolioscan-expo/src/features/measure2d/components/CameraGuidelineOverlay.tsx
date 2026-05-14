import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, G, Mask, Path, Rect } from 'react-native-svg';

import CameraGuideline from '../../../../assets/images/camera_guideline.svg';
import { type GuidelineDisplayGeometry } from '../domain/guidelineGeometry';

// 이 컴포넌트는 화면에 보이는 가이드라인과 dimmed 오버레이만 담당한다.
const GUIDE_PATH =
  'M48.998 585.5C48.998 525 37.9909 446.42 37.9909 446.42C32.3512 445.777 34.9595 445.906 28.4739 445.135C20.3668 444.17 13.3172 434.848 10.8494 422.632C8.87517 412.859 10.0268 394.129 10.8494 385.985C10.8494 385.985 4.14554 332.621 3.79976 272.829C3.45398 213.036 -3.09736 172.21 16.8421 154.208C32.0083 140.515 57.166 136.06 74.7902 126.562C82.5448 122.383 91.5467 118.847 92.9567 114.668C94.5401 109.974 94.7912 104.216 93.8708 98.2487C93.3749 95.034 85.9263 91.1765 84.1638 84.7471C82.6658 79.2822 78.1251 69.0194 78.1251 48.767C78.1251 28.5147 80.639 2.5 118.498 2.5C156.357 2.5 158.871 28.5147 158.871 48.767C158.871 69.0194 154.33 79.2822 152.832 84.7471C151.07 91.1765 143.621 95.034 143.125 98.2487C142.205 104.216 142.456 109.974 144.039 114.668C145.449 118.847 154.451 122.383 162.206 126.562C179.83 136.06 204.988 140.515 220.154 154.208C240.093 172.21 233.542 213.036 233.196 272.829C232.851 332.621 226.147 385.985 226.147 385.985C226.969 394.129 228.121 412.859 226.147 422.632C223.679 434.848 216.629 444.17 208.522 445.135C202.037 445.906 204.645 445.777 199.005 446.42C199.005 446.42 191.998 535.5 189.498 585.5';

// 원본 SVG 크기. scale 계산의 기준이 되므로 SVG와 동일하게 유지한다.
const BASE_W = 237;
const BASE_H = 588;

type CameraGuidelineOverlayProps = {
  width: number;
  height: number;
  geometry: GuidelineDisplayGeometry;
  // 자동 판정이 성공하면 초록색 윤곽선으로 바꿔서 촬영 대기 상태를 보여준다.
  aligned?: boolean;
};


export function CameraGuidelineOverlay({
  width,
  height,
  geometry,
  aligned = false,
}: CameraGuidelineOverlayProps) {
  const { guideX, guideY, guideWidth, guideHeight } = geometry;
  // geometry는 화면 픽셀 좌표이고, 내부 사람 실루엣은 원본 SVG 비율에 맞춰 스케일한다.

  // 부모가 넘긴 stage 크기를 기준으로 가이드라인의 실제 화면 위치를 계산한다.
  // const guideWidth = width * 0.62;
  // const guideHeight = guideWidth * (BASE_H / BASE_W);
  // const guideX = (width - guideWidth) / 2;
  // const guideY = height - guideHeight;

  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width, height }} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          {/* 마스크에서는 흰색이 보이고 검은색이 뚫린다. */}
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
          // 바깥 영역만 dimmed 처리해서 사용자가 가이드라인 밖을 인식하기 쉽도록 한다.
          fill="rgba(59, 64, 73, 0.25)"
          mask="url(#camera-cutout)"
        />
      </Svg>

      {/* 윤곽선 이미지는 실제 사용자가 따라야 하는 시각적 가이드다. */}
      <View
        style={{
          position: 'absolute',
          left: guideX,
          top: guideY,
          width: guideWidth,
          height: guideHeight,
          opacity: aligned ? 0 : 1,
        }}
      >
        <CameraGuideline width="100%" height="100%" />
      </View>

      {aligned ? (
        // aligned 상태에서는 원본 가이드 이미지를 숨기고 성공 상태용 초록색 선만 덧그린다.
        <Svg
          width={guideWidth}
          height={guideHeight}
          viewBox={`0 0 ${BASE_W} ${BASE_H}`}
          style={{ position: 'absolute', left: guideX, top: guideY }}
        >
          <Path
            d={GUIDE_PATH}
            fill="none"
            stroke="#20C99C"
            strokeWidth={4.8}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      ) : null}
    </View>
  );
}
