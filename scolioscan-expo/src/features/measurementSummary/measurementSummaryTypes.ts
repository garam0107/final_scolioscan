export type CurvatureSummaryItem<Key extends string = string> = {
  key: Key;
  label: string;
  value: string;
};

export type CurvatureTrendPoint = {
  x: number;
  y: number;
};

export const CURVATURE_TREND_CHART_HEIGHT = 120;
export const CURVATURE_TREND_CHART_MAX_VALUE = 40;
