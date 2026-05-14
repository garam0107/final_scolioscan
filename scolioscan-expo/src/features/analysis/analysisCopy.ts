import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';

import type { DominantCurveInfo } from './severity';
import Grade1Image from '../../../assets/images/grade1.svg';
import Grade2Image from '../../../assets/images/grade2.svg';
import Grade3Image from '../../../assets/images/grade3.svg';
import Grade4Image from '../../../assets/images/grade4.svg';

export type InfoCardLevel = '정상' | '경도' | '중등도' | '고도';

type InfoCardCopy = {
  title: string;
  body: string;
  ImageComponent: ComponentType<SvgProps>;
};

type CurvePatternCopy = {
  title: string;
  body: string;
};

// 분석 카드 문구와 이미지는 화면 렌더링 로직과 분리해 한 곳에서 관리한다.
export function getInfoCardCopy(infoCardLevel: InfoCardLevel): InfoCardCopy {
  switch (infoCardLevel) {
    case '정상':
      return {
        title: '정상 범위를 유지한 운동',
        body: '50분마다 간단한 스트레칭을 하고, 수영, 요가, 필라테스 등을 도전해보세요.',
        ImageComponent: Grade1Image,
      };
    case '경도':
      return {
        title: '경도 척추측만증이란?',
        body: "콥각도(cobb's angle)가 15도 이상으로 측정된 상태예요. 자세 습관을 관리하면서 변화를 확인해 주세요.",
        ImageComponent: Grade2Image,
      };
    case '중등도':
      return {
        title: '중등도 척추측만증이란?',
        body: "콥각도(cobb's angle)가 25도 이상으로 높아진 상태예요. 전문적인 진료와 관리 방향을 함께 확인해 주세요.",
        ImageComponent: Grade3Image,
      };
    case '고도':
      return {
        title: '고도 척추측만증이란?',
        body: "콥각도(cobb's angle)가 45도 이상으로 높아진 상태예요. 눈에 띌 정도로 심한 외관 변형과 심한 경우 흉곽 압박으로 심폐기능 이상을 초래할 수 있습니다.",
        ImageComponent: Grade4Image,
      };
  }
}

export function getCurvePatternCopy(dominantCurve: DominantCurveInfo): CurvePatternCopy {
  // dominant curve 분류 결과를 사용자에게 보여줄 제목과 설명 문구로 바꾼다.
  switch (dominantCurve.key) {
    case 'Normal':
      return {
        title: '정상 범위',
        body: '현재는 뚜렷한 지배 만곡 패턴이 보이지 않아요.',
      };
    case 'Thoracic':
      return {
        title: '흉추 만곡 (S자형)',
        body: '등 부위 중심으로 만곡이 나타나는 형태예요.',
      };
    case 'Double Thoracic':
      return { 
        title: '이중 흉추 만곡 (C자형)',
        body: '상부와 주 흉추에 함께 만곡이 나타나는 형태예요.',
      };
    case 'Double major':
      return {
        title: '흉추-요추 만곡 (C자형)',
        body: '등과 허리에 반대 방향의 만곡이 있는 S자 형태예요.',
      };
    case 'Triple curve':
      return {
        title: '삼중 만곡 (C자형)',
        body: '상부 흉추, 주 흉추, 요추에 모두 만곡이 나타나는 형태예요.',
      };
    case 'Lumbar':
      return {
        title: '요추 만곡 (S자형)',
        body: '허리 부위 중심으로 만곡이 나타나는 형태예요.',
      };
    case 'Unknown':
      return {
        title: '비표준 만곡',
        body: '일반적인 분류에 딱 맞지 않는 만곡 패턴이에요.',
      };
  }
}
