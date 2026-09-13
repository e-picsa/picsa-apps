import cdf from '@stdlib/stats-base-dists-t-cdf';
import { linearRegression, linearRegressionLine, sampleCorrelation } from 'simple-statistics';

export type TrendlinePeriod = 'full' | '30_year' | '10_year';

export type TrendStatus =
  | 'significant_up'
  | 'significant_down'
  | 'uncertain_trend'
  | 'weak_trend'
  | 'no_trend'
  | 'constant_y'
  | 'insufficient_data'
  | 'unavailable'
  | 'descriptive';

export interface ITrendlineFit {
  slope: number;
  intercept: number;
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  r: number | null;
  rSquared: number | null;
  changePerDecade: number;
}

export interface ISignificanceResult {
  tStat: number | null;
  df: number | null;
  pValue: number | null;
}

export interface ITrendlineStats {
  n: number;
  isConsecutive: boolean;
  slope: number | null;
  intercept: number | null;
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  r: number | null;
  rSquared: number | null;
  changePerDecade: number | null;
  tStat: number | null;
  df: number | null;
  pValue: number | null;
  isSignificant: boolean;
  status: TrendStatus;
  shouldPlotLine: boolean;
  message?: string;
  subtext?: string;
}

/** Minimum number of observations required for full record trend assessment */
export const MIN_OBSERVATIONS_FULL = 20;
/** Minimum number of observations required for 30-year period trend assessment */
export const MIN_OBSERVATIONS_30_YEAR = 20;
/** Minimum number of observations required for 10-year period trend assessment (at least 7 out of 10 years) */
export const MIN_OBSERVATIONS_10_YEAR = 7;
/** Minimum completeness ratio (observations / year span) across full record */
export const MIN_COMPLETENESS_RATIO = 0.7;
/** Maximum p-value for statistical significance (p < 0.05) */
export const SIGNIFICANCE_P_THRESHOLD = 0.05;
/** Correlation threshold below which a non-significant trend is considered weak/minimal rather than uncertain */
export const WEAK_CORRELATION_THRESHOLD = 0.15;

/**
 * Checks if a sorted array of points has consecutive x values (step = 1).
 */
export function checkConsecutiveYears(points: { x: number }[]): boolean {
  if (points.length <= 1) return true;
  for (let i = 1; i < points.length; i++) {
    if (points[i].x !== points[i - 1].x + 1) {
      return false;
    }
  }
  return true;
}

/**
 * Fits an Ordinary Least Squares (OLS) regression line to a set of points using `simple-statistics`.
 *
 * Computes:
 * - slope (m) and intercept (b)
 * - fitted startY and endY at the minimum and maximum x
 * - Pearson correlation coefficient (r)
 * - Coefficient of determination (rSquared)
 * - Change per decade (slope * 10)
 *
 * Returns null if points are fewer than 2 or if all x values are identical (constant X).
 */
export function fitLinearRegression(points: { x: number; y: number }[]): ITrendlineFit | null {
  if (points.length < 2) return null;

  const startX = points[0].x;
  const endX = points[points.length - 1].x;

  // If all X values are identical, slope is vertical/undefined
  if (startX === endX) {
    return null;
  }

  // Check if all Y values are identical (flat horizontal line)
  const firstY = points[0].y;
  const isConstantY = points.every((p) => p.y === firstY);
  if (isConstantY) {
    return {
      slope: 0,
      intercept: firstY,
      startX,
      endX,
      startY: firstY,
      endY: firstY,
      r: null,
      rSquared: null,
      changePerDecade: 0,
    };
  }

  // Prepare input format for simple-statistics [[x, y], ...]
  const coords = points.map((p) => [p.x, p.y] as [number, number]);
  const reg = linearRegression(coords);
  if (!Number.isFinite(reg.m) || !Number.isFinite(reg.b)) {
    return null;
  }

  const lineFn = linearRegressionLine(reg);
  const startY = lineFn(startX);
  const endY = lineFn(endX);

  const xVals = points.map((p) => p.x);
  const yVals = points.map((p) => p.y);
  let r: number | null = null;
  let rSquared: number | null = null;

  try {
    const rawR = sampleCorrelation(xVals, yVals);
    if (Number.isFinite(rawR)) {
      r = Math.max(-1, Math.min(1, rawR));
      rSquared = r * r;
    }
  } catch {
    r = null;
    rSquared = null;
  }

  return {
    slope: reg.m,
    intercept: reg.b,
    startX,
    endX,
    startY,
    endY,
    r,
    rSquared,
    changePerDecade: reg.m * 10,
  };
}

/**
 * Calculates conventional Student's t-test p-value using `@stdlib/stats-base-dists-t-cdf`.
 *
 * WHY THIS IS SEPARATED FROM REGRESSION:
 * `simple-statistics` provides the descriptive trendline slope, intercept, and correlation coefficient (r),
 * but does not compute hypothesis test p-values.
 * We calculate p-values specifically to support significance classification (distinguishing statistically
 * clear trends from uncertain or weak trends).
 *
 * CAVEAT / METHODOLOGY LIMITATION:
 * This conventional t-test assumes independent errors and does NOT account for potential serial
 * autocorrelation (persistence) in climate time series. It represents an approximate assessment of
 * historical correlation, not a predictive forecast or proof of climate change.
 */
export function calculateSignificance(r: number | null, n: number): ISignificanceResult {
  if (r === null || !Number.isFinite(r) || n < 3) {
    return { tStat: null, df: null, pValue: null };
  }

  const df = n - 2;
  const denom = 1 - r * r;

  // Perfect or near-perfect correlation edge case
  if (denom <= 1e-14) {
    const tStat = r > 0 ? Infinity : -Infinity;
    return { tStat, df, pValue: 0 };
  }

  const tStat = r * Math.sqrt(df / denom);
  if (!Number.isFinite(tStat)) {
    return { tStat: null, df: null, pValue: null };
  }

  const p = 2 * cdf(-Math.abs(tStat), df);
  const pValue = Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : null;

  return { tStat, df, pValue };
}

/**
 * Application wrapper for trendline computation:
 * 1. Cleans and filters observation points (ensuring finite numbers and valid years).
 * 2. Applies period slicing ('full', '30_year', '10_year').
 * 3. Enforces data sufficiency guardrails:
 *    - 10-year view: evaluates the last 10-year window, requiring at least 7 usable years.
 *    - 30-year view: evaluates the last 30-year window, requiring at least 20 usable years.
 *    - Full record: requires at least 20 usable years and >= 70% completeness across span.
 * 4. Generates descriptive fit via `simple-statistics` and significance via `@stdlib/stats-base-dists-t-cdf`.
 * 5. Classifies the trend:
 *    - Statistically clear (p < pThreshold): plotted in series color.
 *    - Uncertain trend (p >= pThreshold with observable slope |r| >= 0.15): plotted as a grey dashed line.
 *    - Weak / minimal trend (p >= pThreshold with |r| < 0.15): plotted as a faint grey line.
 *    - Insufficient data: no line plotted on chart; specific data deficiency reason reported.
 */
export function calculateLinearRegression(
  rawPoints: { x: number; y: number }[],
  period: TrendlinePeriod = 'full',
  pThreshold = SIGNIFICANCE_P_THRESHOLD,
): ITrendlineStats {
  // 1. Data Cleaning & Sorting: Filter out NaN, null, and non-finite values; sort chronologically
  const cleanPoints = rawPoints
    .filter((p) => typeof p.x === 'number' && Number.isFinite(p.x) && typeof p.y === 'number' && Number.isFinite(p.y))
    .sort((a, b) => a.x - b.x);

  // Edge case: Fewer than 2 observations
  if (cleanPoints.length < 2) {
    const n = cleanPoints.length;
    const startX = n > 0 ? cleanPoints[0].x : 0;
    const endX = n > 0 ? cleanPoints[n - 1].x : 0;
    return {
      n,
      isConsecutive: true,
      slope: null,
      intercept: null,
      startX,
      endX,
      startY: 0,
      endY: 0,
      r: null,
      rSquared: null,
      changePerDecade: null,
      tStat: null,
      df: null,
      pValue: null,
      isSignificant: false,
      status: 'unavailable',
      shouldPlotLine: false,
      message: 'Trend assessment unavailable',
      subtext: 'Requires at least 2 valid observations',
    };
  }

  // 2. Period Slicing:
  // For 10-year and 30-year views, filter points within the most recent window relative to max recorded year
  const maxYear = cleanPoints[cleanPoints.length - 1].x;
  let points: { x: number; y: number }[];
  let minRequiredObs: number;
  let isSufficient = true;
  let sufficiencyReason = '';

  if (period === '10_year') {
    points = cleanPoints.filter((p) => p.x >= maxYear - 9);
    minRequiredObs = MIN_OBSERVATIONS_10_YEAR;
    if (points.length < minRequiredObs) {
      isSufficient = false;
      sufficiencyReason = `Requires at least ${minRequiredObs} usable years in the 10-year period (found ${points.length})`;
    }
  } else if (period === '30_year') {
    points = cleanPoints.filter((p) => p.x >= maxYear - 29);
    minRequiredObs = MIN_OBSERVATIONS_30_YEAR;
    if (points.length < minRequiredObs) {
      isSufficient = false;
      sufficiencyReason = `Requires at least ${minRequiredObs} usable years in the 30-year period (found ${points.length})`;
    }
  } else {
    points = cleanPoints;
    minRequiredObs = MIN_OBSERVATIONS_FULL;
    const span = points[points.length - 1].x - points[0].x + 1;
    const completeness = points.length / span;

    if (points.length < minRequiredObs) {
      isSufficient = false;
      sufficiencyReason = `Requires at least ${minRequiredObs} usable years (found ${points.length})`;
    } else if (completeness < MIN_COMPLETENESS_RATIO) {
      isSufficient = false;
      sufficiencyReason = `Observation record is less than ${Math.round(
        MIN_COMPLETENESS_RATIO * 100,
      )}% complete over its timespan`;
    }
  }

  const n = points.length;
  const isConsecutive = checkConsecutiveYears(points);
  const startX = points.length > 0 ? points[0].x : 0;
  const endX = points.length > 0 ? points[points.length - 1].x : 0;

  // If sliced window has fewer than 2 observations, we cannot fit a line
  if (n < 2) {
    return {
      n,
      isConsecutive,
      slope: null,
      intercept: null,
      startX,
      endX,
      startY: 0,
      endY: 0,
      r: null,
      rSquared: null,
      changePerDecade: null,
      tStat: null,
      df: null,
      pValue: null,
      isSignificant: false,
      status: 'insufficient_data',
      shouldPlotLine: false,
      message: 'Not enough usable data to assess a trend.',
      subtext: sufficiencyReason || 'Requires at least 2 valid observations in selected period',
    };
  }

  // 3. Descriptive Fit using simple-statistics
  const fit = fitLinearRegression(points);

  // Degenerate case: Constant X
  if (!fit) {
    return {
      n,
      isConsecutive,
      slope: null,
      intercept: null,
      startX,
      endX,
      startY: 0,
      endY: 0,
      r: null,
      rSquared: null,
      changePerDecade: null,
      tStat: null,
      df: null,
      pValue: null,
      isSignificant: false,
      status: 'unavailable',
      shouldPlotLine: false,
      message: 'Trend assessment unavailable',
      subtext: 'Constant X values (no variation in time)',
    };
  }

  // Degenerate case: Constant Y (horizontal line)
  if (fit.r === null && fit.slope === 0) {
    return {
      n,
      isConsecutive,
      slope: 0,
      intercept: fit.intercept,
      startX: fit.startX,
      endX: fit.endX,
      startY: fit.startY,
      endY: fit.endY,
      r: null,
      rSquared: null,
      changePerDecade: 0,
      tStat: null,
      df: null,
      pValue: null,
      isSignificant: false,
      status: 'constant_y',
      shouldPlotLine: false,
      message: 'No clear trend detected for this period.',
      subtext: 'All observation values are identical (constant Y)',
    };
  }

  // 4. Significance Testing using @stdlib/stats-base-dists-t-cdf
  const sig = calculateSignificance(fit.r, n);

  // 5. Data Sufficiency Evaluation:
  // If data is insufficient, suppress line plotting on chart but return descriptive stats for the panel
  if (!isSufficient) {
    return {
      n,
      isConsecutive,
      slope: fit.slope,
      intercept: fit.intercept,
      startX: fit.startX,
      endX: fit.endX,
      startY: fit.startY,
      endY: fit.endY,
      r: fit.r,
      rSquared: fit.rSquared,
      changePerDecade: fit.changePerDecade,
      tStat: sig.tStat,
      df: sig.df,
      pValue: sig.pValue,
      isSignificant: false,
      status: 'insufficient_data',
      shouldPlotLine: false,
      message: 'Not enough usable data to assess a trend.',
      subtext: sufficiencyReason,
    };
  }

  // 6. Trend Classification:
  // Statistically Clear (p < pThreshold)
  if (sig.pValue !== null && sig.pValue < pThreshold) {
    const status: TrendStatus = fit.slope > 0 ? 'significant_up' : 'significant_down';
    const direction = fit.slope > 0 ? 'Upward' : 'Downward';
    return {
      n,
      isConsecutive,
      slope: fit.slope,
      intercept: fit.intercept,
      startX: fit.startX,
      endX: fit.endX,
      startY: fit.startY,
      endY: fit.endY,
      r: fit.r,
      rSquared: fit.rSquared,
      changePerDecade: fit.changePerDecade,
      tStat: sig.tStat,
      df: sig.df,
      pValue: sig.pValue,
      isSignificant: true,
      status,
      shouldPlotLine: true,
      message: `${direction} trend detected`,
      subtext: `p = ${formatPValue(sig.pValue)} (statistically clear)`,
    };
  }

  // When p >= pThreshold:
  // Still display on graph as a grey line, differentiating between weak estimates and uncertain trends
  const isWeak = fit.r === null || Math.abs(fit.r) < WEAK_CORRELATION_THRESHOLD;
  const status: TrendStatus = isWeak ? 'weak_trend' : 'uncertain_trend';
  const direction = fit.slope > 0 ? 'upward' : 'downward';
  const message = isWeak ? 'Weak or minimal trend' : `Uncertain ${direction} trend`;
  const subtext = isWeak
    ? `p = ${formatPValue(sig.pValue)} (little historical change)`
    : `p = ${formatPValue(sig.pValue)} (high year-to-year variation)`;

  return {
    n,
    isConsecutive,
    slope: fit.slope,
    intercept: fit.intercept,
    startX: fit.startX,
    endX: fit.endX,
    startY: fit.startY,
    endY: fit.endY,
    r: fit.r,
    rSquared: fit.rSquared,
    changePerDecade: fit.changePerDecade,
    tStat: sig.tStat,
    df: sig.df,
    pValue: sig.pValue,
    isSignificant: false,
    status,
    shouldPlotLine: true,
    message,
    subtext,
  };
}

/**
 * Formats a p-value for user display.
 */
export function formatPValue(pValue: number | null | undefined): string {
  if (pValue === null || pValue === undefined || !Number.isFinite(pValue)) {
    return '—';
  }
  if (pValue < 0.001) {
    return '< 0.001';
  }
  return pValue.toFixed(3);
}
