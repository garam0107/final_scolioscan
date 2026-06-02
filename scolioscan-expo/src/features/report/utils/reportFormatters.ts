export const CURVATURE_METRIC_LABELS = [
  '상부 흉추만곡',
  '주 흉추만곡',
  '요추만곡',
] as const;

export function formatRoundedDegree(value?: number | null) {
  if (value === null || value === undefined) return '-';
  return `${(Math.round(Math.abs(value) * 10) / 10).toFixed(1)}°`;
}
