export type SeverityKey = 'normal' | 'moderate' | 'severe';

export type SeverityConfig = {
  key: SeverityKey;
  label: '정상' | '보통' | '위험';
  badgeBackground: string;
  badgeTextColor: string;
  barColor: string;
  trackColor: string;
};

const SEVERITY_PALETTE: Record<SeverityKey, Omit<SeverityConfig, 'key'>> = {
  normal: {
    label: '정상',
    badgeBackground: '#D7F9F9',
    badgeTextColor: '#22BCB7',
    barColor: '#7AD7D4',
    trackColor: '#D4D9E2',
  },
  moderate: {
    label: '보통',
    badgeBackground: '#FEF8DF',
    badgeTextColor: '#FABE00',
    barColor: '#FAD342',
    trackColor: '#D4D9E2',
  },
  severe: {
    label: '위험',
    badgeBackground: '#FFEDF0',
    badgeTextColor: '#F97B7B',
    barColor: '#F97B7B',
    trackColor: '#D4D9E2',
  },
};

// 3단계 임계값: <15° 정상 / 15–24° 보통 / ≥25° 위험
export function getRegionalSeverity(angleDeg: number): SeverityConfig {
  // 각 부위의 절대 각도를 기준으로 정상/보통/위험 색상 세트를 고른다.
  const value = Math.abs(angleDeg);
  let key: SeverityKey;
  if (value < 15) key = 'normal';
  else if (value < 25) key = 'moderate';
  else key = 'severe';
  return { key, ...SEVERITY_PALETTE[key] };
}

export function getOverallSeverity(
  secondaryThoracic: number,
  mainThoracic: number,
  lumbar: number,
): SeverityConfig {
  // 여러 만곡 값 중 가장 큰 값을 전체 위험도 기준으로 사용한다.
  const max = Math.max(
    Math.abs(secondaryThoracic),
    Math.abs(mainThoracic),
    Math.abs(lumbar),
  );
  return getRegionalSeverity(max);
}

export const SEVERITY_BAR_MAX = 50;

export function getSeverityBarPercent(angleDeg: number): number {
  // 막대 그래프는 최대 기준값을 넘지 않도록 잘라서 퍼센트로 변환한다.
  const clamped = Math.max(0, Math.min(SEVERITY_BAR_MAX, Math.abs(angleDeg)));
  return (clamped / SEVERITY_BAR_MAX) * 100;
}

// ===== 척추 지배만곡 유형 =====
// AIS-API server.py classify_three()와 동일한 임계값(8°) + 매핑

export type DominantCurveKey =
  | 'Normal'
  | 'Thoracic'
  | 'Double Thoracic'
  | 'Double major'
  | 'Triple curve'
  | 'Lumbar'
  | 'Unknown';

export type DominantCurveInfo = {
  key: DominantCurveKey;
  diagnosisName: string;
  affectedRegions: ('upper' | 'main' | 'lumbar')[];
};

const CURVE_THRESHOLD = 8;

const CURVE_INFO: Record<DominantCurveKey, Omit<DominantCurveInfo, 'key'>> = {
  Normal: {
    diagnosisName: '정상',
    affectedRegions: [],
  },
  Thoracic: {
    diagnosisName: '흉추형 척추측만증',
    affectedRegions: ['main'],
  },
  'Double Thoracic': {
    diagnosisName: '이중 흉추형 척추측만증',
    affectedRegions: ['upper', 'main'],
  },
  'Double major': {
    diagnosisName: '이중 주만곡형 척추측만증',
    affectedRegions: ['main', 'lumbar'],
  },
  'Triple curve': {
    diagnosisName: '삼중 만곡형 척추측만증',
    affectedRegions: ['upper', 'main', 'lumbar'],
  },
  Lumbar: {
    diagnosisName: '요추형 척추측만증',
    affectedRegions: ['lumbar'],
  },
  Unknown: {
    diagnosisName: '비표준 만곡형 척추측만증',
    affectedRegions: [],
  },
};

export function classifyDominantCurve(
  secondaryThoracic: number,
  mainThoracic: number,
  lumbar: number,
): DominantCurveInfo {
  // 세 구간이 임계값보다 휘었는지 여부를 패턴으로 만들어 대표 만곡 유형을 찾는다.
  const labels = [secondaryThoracic, mainThoracic, lumbar].map((value) =>
    Math.abs(value) <= CURVE_THRESHOLD ? 'Straight' : 'Bent',
  );
  const pattern = labels.join('-');
  const mapping: Record<string, DominantCurveKey> = {
    'Straight-Straight-Straight': 'Normal',
    'Straight-Bent-Straight': 'Thoracic',
    'Bent-Bent-Straight': 'Double Thoracic',
    'Straight-Bent-Bent': 'Double major',
    'Bent-Bent-Bent': 'Triple curve',
    'Straight-Straight-Bent': 'Lumbar',
  };
  const key = mapping[pattern] ?? 'Unknown';
  return { key, ...CURVE_INFO[key] };
}

export function getDominantCurveInfo(key: DominantCurveKey): DominantCurveInfo {
  // 서버에서 이미 분류된 back_type을 화면 표시용 정보로 변환한다.
  return { key, ...CURVE_INFO[key] };
}
