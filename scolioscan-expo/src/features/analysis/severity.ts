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
  const max = Math.max(
    Math.abs(secondaryThoracic),
    Math.abs(mainThoracic),
    Math.abs(lumbar),
  );
  return getRegionalSeverity(max);
}

export const SEVERITY_BAR_MAX = 50;

export function getSeverityBarPercent(angleDeg: number): number {
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
  return { key, ...CURVE_INFO[key] };
}
