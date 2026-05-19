export type AnalysisRegionKey = 'upper' | 'main' | 'lumbar';

export function formatDegree(value: number) {
  // 분석 각도는 화면 전체에서 같은 반올림 규칙과 단위로 표시합니다.
  return `${Math.round(Math.abs(value))}°`;
}

export function regionDisplayLabel(key: AnalysisRegionKey): string {
  switch (key) {
    case 'upper':
      return '상부 흉추';
    case 'main':
      return '주 흉추';
    case 'lumbar':
      return '요추';
  }
}
