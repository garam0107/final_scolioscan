import type { AnalysisResponse } from '@/src/types/analysis';

// 척추 마디 개수
export const VERTEBRA_COUNT = 14;

// 척추뼈 한 마디의 위치와 회전값 구조
export type VertebraPose = {
  x: number;
  rotation: number;
};

// 화면에 보여줄 각도 라벨 하나의 구조
export type MetricPose = {
  key: 'upper' | 'main' | 'lumbar';
  label: string;
  value: number;
  side: 'left' | 'right';
  topRatio: number;
  xOffset: number;
};

// 원호 표시용 위치/ 크기 정보 구조, 지금은 잠시 사용 안함. 추후 넣을 예정
export type ArcPose = {
  key: 'upper' | 'main' | 'lumbar';
  x: number;
  vertebraIndex: number;
  radiusRatio: number;
};

// 분석 화면에서 쓰이는 전체 pose 구조
// metrics : 각도 라벨 3개를 보여주기 위한 배열
// vertebrae : 척추 이미지들을 어디에 어떻게 배치할지 담은 배열
// arcs : 원호 표시용 좌표 배열
export type AnalysisPose = {
  metrics: MetricPose[];
  vertebrae: VertebraPose[];
  arcs: ArcPose[];
};

// response로 들어온 값을 분석 화면에서 보여줄 수 있는 범위로 정리 

// value : 서버에서 받아온 값
function clampDegree(value?: number | null) {
  // 화면 애니메이션이 과하게 휘지 않도록 분석 각도를 표시 가능한 범위로 제한한다.
  if (value === null || value === undefined || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(45, Math.abs(value)));
}

// 두 위치를 부드럽게 이어서 척추 곡선을 표시
// a : 시작 위치, b : 끝 위치, t : 0~1 사이의 진행률
function smoothLerp(a: number, b: number, t: number) {
  // 직선 보간보다 부드러운 곡선으로 척추 마디의 x 위치를 이어준다.
  const ct = (1 - Math.cos(t * Math.PI)) / 2;
  return a + (b - a) * ct;
}

function getMetricXOffset(key: 'upper' | 'main' | 'lumbar', value: number) {
  // 각도 라벨이 척추 이미지와 겹치지 않도록 만곡 크기에 따라 조금씩 밀어낸다.
  // 각도가 커질수록 라벨을 곡선 바깥쪽으로 조금 더 밀어 뼈와 겹치지 않게 한다.
  const dynamicOffset = Math.min(26, value * 0.75);

  if (key === 'upper') {
    return -14 - dynamicOffset;
  }

  if (key === 'main') {
    return 10 + dynamicOffset;
  }

  return -8 - dynamicOffset * 0.2;
}

// 상부 흉추만곡 각도에 따라 달라지는 텍스트 표시 — severity.ts 임계값과 동일
export function getSeverityLabel(upper: number): '정상' | '보통' | '위험' {
  const value = Math.abs(upper);
  if (value < 15) return '정상';
  if (value < 25) return '보통';
  return '위험';
}


// 세 구간의 만곡을 척추 마디별 x 오프셋과 회전값으로 변환
// upper : 상부 흉추 만곡값, main : 주 흉추 만곡값, lumber : 요추 만곡값
function buildSpineTrack(upper: number, main: number, lumbar: number): VertebraPose[] {
  // 세 구간의 만곡 각도를 척추 마디별 x 이동과 회전값으로 변환한다.
  const vertebraHeight = 20;
  const lastIndex = VERTEBRA_COUNT - 1;

  // 실제 측정값 보다 화면에서 다이나믹하게 보이도록 하는 계수
  const visualScale = 1.2;
  const spine5X = (upper * 0.82 + main * 0.12 * 0.85) * visualScale; 
  const spine10X = -(lumbar * 0.82 + main * 0.08 * 0.85) * visualScale; 

  const xPositions = Array.from({ length: VERTEBRA_COUNT }, (_, index) => {
    // 0, 4, 9, 마지막 마디를 기준점으로 두고 각 구간을 부드럽게 이어 척추 곡선을 만든다.
    if (index === 0 || index === lastIndex) return 0;
    if (index <= 4) return smoothLerp(0, spine5X, index / 4);
    if (index <= 9) return smoothLerp(spine5X, spine10X, (index - 4) / 5);
    return smoothLerp(spine10X, 0, (index - 9) / (lastIndex - 9));
  });

  return xPositions.map((x, index) => {
    let rotation = 0;
    if (index > 0 && index < lastIndex) {
      // 인접한 점을 이용해 각 마디의 기울기 추정
      const dx = xPositions[index + 1] - xPositions[index - 1];
      const dy = vertebraHeight * 2;
      rotation = -Math.atan2(dx, dy) * (180 / Math.PI);

      rotation *= visualScale;
    }
    return { x, rotation };
  });
}

export function createAnalysisPose(analysis: AnalysisResponse | null): AnalysisPose {
  // API 응답 하나를 화면에서 필요한 라벨, 척추 마디, 원형 표시 좌표로 분해한다.
  // 백엔드 필드를 분석 화면에표시할 세 개의 라벨로 매핑
  const upper = clampDegree(analysis?.main_thoracic);
  const main = clampDegree(analysis?.second_thoracic ?? upper * 0.72);
  const lumbar = clampDegree(analysis?.lumbar);
  // 서버 필드명이 화면 부위명과 완전히 같지 않아 여기서 상부, 주흉추, 요추 값으로 정규화한다.
  const vertebrae = buildSpineTrack(upper, main, lumbar);

  return {
    metrics: [
      { key: 'upper', label: '상부 흉추만곡', value: upper, side: 'left', topRatio: 0.14, xOffset: getMetricXOffset('upper', upper) },
      { key: 'main', label: '주 흉추만곡', value: main, side: 'right', topRatio: 0.47, xOffset: getMetricXOffset('main', main) },
      { key: 'lumbar', label: '요추만곡', value: lumbar, side: 'right', topRatio: 0.76, xOffset: getMetricXOffset('lumbar', lumbar) },
    ],
    vertebrae,
    // 원은 각 영역을 대표하는 척추뼈 index를 기준으로 배치해 뼈의 움직임과 같은 기준을 사용한다.
    arcs: [
      { key: 'upper', x: (vertebrae[3]?.x ?? 0) + 5, vertebraIndex: 3, radiusRatio: 0.15 },
      { key: 'main', x: (vertebrae[7]?.x ?? 0) + 5, vertebraIndex: 7, radiusRatio: 0.15 },
      { key: 'lumbar', x: (vertebrae[11]?.x ?? 0) + 5, vertebraIndex: 11, radiusRatio: 0.15 },
    ],
  };
}
