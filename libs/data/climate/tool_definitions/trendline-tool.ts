import { ITrendlineToolOptions } from '@picsa/models';

export type TrendlineOutcome =
  | 'upward_trend'
  | 'downward_trend'
  | 'no_clear_trend'
  | 'insufficient_data'
  | 'unavailable';

export const TRENDLINE_OUTCOME_LABELS: Record<TrendlineOutcome, string> = {
  upward_trend: 'Upward trend',
  downward_trend: 'Downward trend',
  no_clear_trend: 'No clear trend',
  insufficient_data: 'Insufficient data',
  unavailable: 'Unavailable',
};

/** Operational threshold for statistical clarity (p < 0.05) */
export const TRENDLINE_SIGNIFICANCE_ALPHA = 0.05;

/** Confidence level for slope confidence intervals (95%) */
export const TRENDLINE_CONFIDENCE_LEVEL = 0.95;

/** Minimum number of observations required for full record trend assessment */
export const MIN_OBSERVATIONS_FULL = 20;

/** Minimum number of observations required for 30-year period trend assessment */
export const MIN_OBSERVATIONS_30_YEAR = 20;

/** Minimum completeness ratio (observations / year span) across full record */
export const MIN_COMPLETENESS_RATIO = 0.7;

export const TRENDLINE_TOOL_OPTIONS: ITrendlineToolOptions = {
  enabled: true,
};
