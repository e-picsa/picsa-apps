import cdf from '@stdlib/stats-base-dists-t-cdf';
import { linearRegression, linearRegressionLine, sampleCorrelation } from 'simple-statistics';

export type TrendlinePeriod = 'full' | '30_year';

export type TrendStatus = 'upward_trend' | 'downward_trend' | 'no_clear_trend' | 'insufficient_data' | 'unavailable';

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

export interface IConfidenceIntervalResult {
  ciLowerDecade: number | null;
  ciUpperDecade: number | null;
  seSlope: number | null;
  tCrit: number | null;
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
  ciLowerDecade: number | null;
  ciUpperDecade: number | null;
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
/** Minimum completeness ratio (observations / year span) across full record */
export const MIN_COMPLETENESS_RATIO = 0.7;
/** Maximum p-value for statistical significance (p < 0.05) */
export const SIGNIFICANCE_P_THRESHOLD = 0.05;

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
 * Computes the critical two-tailed Student's t value for a given df and significance level (default alpha = 0.05).
 * Uses monotonic bisection on the Student's t cumulative distribution function.
 */
export function calculateCriticalT(df: number, alpha = 0.05): number {
  if (df <= 0 || !Number.isFinite(df)) return 1.96;
  const target = 1 - alpha / 2; // 0.975 for 95% CI
  let low = 0;
  let high = 100;

  for (let i = 0; i < 25; i++) {
    const mid = (low + high) / 2;
    if (cdf(mid, df) < target) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

/**
 * Calculates standard error of the slope and two-tailed 95% confidence interval for change per decade.
 */
export function calculateConfidenceInterval(
  points: { x: number; y: number }[],
  slope: number | null,
  intercept: number | null,
  df: number | null,
  alpha = 0.05,
): IConfidenceIntervalResult {
  if (slope === null || intercept === null || df === null || df <= 0 || points.length < 3) {
    return { ciLowerDecade: null, ciUpperDecade: null, seSlope: null, tCrit: null };
  }

  const n = points.length;
  let sumX = 0;
  for (const p of points) sumX += p.x;
  const meanX = sumX / n;

  let ssXX = 0;
  let ssRes = 0;
  for (const p of points) {
    const diffX = p.x - meanX;
    ssXX += diffX * diffX;
    const yHat = intercept + slope * p.x;
    const res = p.y - yHat;
    ssRes += res * res;
  }

  if (ssXX <= 0) {
    return { ciLowerDecade: null, ciUpperDecade: null, seSlope: null, tCrit: null };
  }

  const seSlope = Math.sqrt(ssRes / (df * ssXX));
  const tCrit = calculateCriticalT(df, alpha);
  const marginSlope = tCrit * seSlope;

  const lowerSlope = slope - marginSlope;
  const upperSlope = slope + marginSlope;

  return {
    ciLowerDecade: lowerSlope * 10,
    ciUpperDecade: upperSlope * 10,
    seSlope,
    tCrit,
  };
}

/**
 * Application wrapper for trendline computation:
 * 1. Cleans and filters observation points (ensuring finite numbers and valid years).
 * 2. Applies period slicing ('full' or '30_year').
 * 3. Enforces data sufficiency guardrails (at least 20 usable years, >= 70% completeness for full record).
 * 4. Fits OLS regression and calculates Student's t inference + 95% Confidence Interval.
 * 5. Classifies outcome:
 *    - 'upward_trend' / 'downward_trend' (p < 0.05): plotted as a solid coloured line.
 *    - 'no_clear_trend' (p >= 0.05): no line plotted.
 *    - 'insufficient_data': no line plotted; limitation identified.
 */
export function calculateLinearRegression(
  rawPoints: { x: number; y: number }[],
  period: TrendlinePeriod = 'full',
  pThreshold = SIGNIFICANCE_P_THRESHOLD,
): ITrendlineStats {
  // 1. Data Cleaning & Sorting
  const cleanPoints = rawPoints
    .filter((p) => typeof p.x === 'number' && Number.isFinite(p.x) && typeof p.y === 'number' && Number.isFinite(p.y))
    .sort((a, b) => a.x - b.x);

  if (cleanPoints.length < 2) {
    return buildUnavailableStats(cleanPoints.length, 'Requires at least 2 valid observations');
  }

  // 2. Period Slicing
  const maxYear = cleanPoints[cleanPoints.length - 1].x;
  const { points, isSufficient, sufficiencyReason } = slicePeriodPoints(cleanPoints, period, maxYear);
  const n = points.length;
  const isConsecutive = checkConsecutiveYears(points);

  if (n < 2) {
    return buildInsufficientDataStats(
      n,
      isConsecutive,
      sufficiencyReason || 'Requires at least 2 valid observations in selected period',
    );
  }

  // 3. Descriptive Fit
  const fit = fitLinearRegression(points);
  if (!fit) {
    return buildUnavailableStats(n, 'Constant X values (no variation in time)');
  }

  // Constant Y (horizontal line)
  if (fit.r === null && fit.slope === 0) {
    return buildConstantYStats(points, fit, isConsecutive);
  }

  // 4. Statistical Inference & Confidence Intervals
  const sig = calculateSignificance(fit.r, n);
  const ci = calculateConfidenceInterval(points, fit.slope, fit.intercept, sig.df);

  // 5. Data Sufficiency Evaluation
  if (!isSufficient) {
    return buildInsufficientDataStats(n, isConsecutive, sufficiencyReason, fit, sig, ci);
  }

  // 6. Outcome Classification
  const isSignificant = sig.pValue !== null && sig.pValue < pThreshold;
  if (isSignificant) {
    const status: TrendStatus = fit.slope > 0 ? 'upward_trend' : 'downward_trend';
    const message = status === 'upward_trend' ? 'Upward trend' : 'Downward trend';
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
      ciLowerDecade: ci.ciLowerDecade,
      ciUpperDecade: ci.ciUpperDecade,
      tStat: sig.tStat,
      df: sig.df,
      pValue: sig.pValue,
      isSignificant: true,
      status,
      shouldPlotLine: true,
      message,
      subtext: `p = ${formatPValue(sig.pValue)} (statistically clear)`,
    };
  }

  // Inconclusive / No clear trend (p >= pThreshold): NO line plotted on chart
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
    ciLowerDecade: ci.ciLowerDecade,
    ciUpperDecade: ci.ciUpperDecade,
    tStat: sig.tStat,
    df: sig.df,
    pValue: sig.pValue,
    isSignificant: false,
    status: 'no_clear_trend',
    shouldPlotLine: false,
    message: 'No clear trend',
    subtext: `p = ${formatPValue(sig.pValue)} (inconclusive)`,
  };
}

// ---------------------------------------------------------------------------
// Flat Helper Functions for Guards and Formatting
// ---------------------------------------------------------------------------

function slicePeriodPoints(
  cleanPoints: { x: number; y: number }[],
  period: TrendlinePeriod,
  maxYear: number,
): { points: { x: number; y: number }[]; isSufficient: boolean; sufficiencyReason: string } {
  if (period === '30_year') {
    const points = cleanPoints.filter((p) => p.x >= maxYear - 29);
    const isSufficient = points.length >= MIN_OBSERVATIONS_30_YEAR;
    const sufficiencyReason = isSufficient
      ? ''
      : `Requires at least ${MIN_OBSERVATIONS_30_YEAR} usable years in the 30-year period (found ${points.length})`;
    return { points, isSufficient, sufficiencyReason };
  }

  // Full Record
  const points = cleanPoints;
  const span = points[points.length - 1].x - points[0].x + 1;
  const completeness = points.length / span;

  if (points.length < MIN_OBSERVATIONS_FULL) {
    return {
      points,
      isSufficient: false,
      sufficiencyReason: `Requires at least ${MIN_OBSERVATIONS_FULL} usable years (found ${points.length})`,
    };
  }

  if (completeness < MIN_COMPLETENESS_RATIO) {
    return {
      points,
      isSufficient: false,
      sufficiencyReason: `Observation record is less than ${Math.round(
        MIN_COMPLETENESS_RATIO * 100,
      )}% complete over its timespan`,
    };
  }

  return { points, isSufficient: true, sufficiencyReason: '' };
}

function buildUnavailableStats(n: number, subtext: string): ITrendlineStats {
  return {
    n,
    isConsecutive: true,
    slope: null,
    intercept: null,
    startX: 0,
    endX: 0,
    startY: 0,
    endY: 0,
    r: null,
    rSquared: null,
    changePerDecade: null,
    ciLowerDecade: null,
    ciUpperDecade: null,
    tStat: null,
    df: null,
    pValue: null,
    isSignificant: false,
    status: 'unavailable',
    shouldPlotLine: false,
    message: 'Unavailable',
    subtext,
  };
}

function buildConstantYStats(
  points: { x: number; y: number }[],
  fit: ITrendlineFit,
  isConsecutive: boolean,
): ITrendlineStats {
  return {
    n: points.length,
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
    ciLowerDecade: 0,
    ciUpperDecade: 0,
    tStat: null,
    df: null,
    pValue: null,
    isSignificant: false,
    status: 'no_clear_trend',
    shouldPlotLine: false,
    message: 'No clear trend',
    subtext: 'All observation values are identical (constant Y)',
  };
}

function buildInsufficientDataStats(
  n: number,
  isConsecutive: boolean,
  subtext: string,
  fit?: ITrendlineFit | null,
  sig?: ISignificanceResult,
  ci?: IConfidenceIntervalResult,
): ITrendlineStats {
  return {
    n,
    isConsecutive,
    slope: fit?.slope ?? null,
    intercept: fit?.intercept ?? null,
    startX: fit?.startX ?? 0,
    endX: fit?.endX ?? 0,
    startY: fit?.startY ?? 0,
    endY: fit?.endY ?? 0,
    r: fit?.r ?? null,
    rSquared: fit?.rSquared ?? null,
    changePerDecade: fit?.changePerDecade ?? null,
    ciLowerDecade: ci?.ciLowerDecade ?? null,
    ciUpperDecade: ci?.ciUpperDecade ?? null,
    tStat: sig?.tStat ?? null,
    df: sig?.df ?? null,
    pValue: sig?.pValue ?? null,
    isSignificant: false,
    status: 'insufficient_data',
    shouldPlotLine: false,
    message: 'Insufficient data',
    subtext,
  };
}

/**
 * Formats decadal rate of change with sign and units.
 * Temperature values keep 1 decimal place; all other values round to nearest integer.
 */
export function formatDecadeRate(val: number | null | undefined, units: string, isTemperature: boolean): string {
  if (val === null || val === undefined || !Number.isFinite(val)) {
    return '—';
  }

  let formattedVal: string;
  if (isTemperature) {
    formattedVal = val.toFixed(1);
  } else {
    const rounded = Math.round(val);
    formattedVal = Object.is(rounded, -0) ? '0' : rounded.toString();
  }

  const sign = val > 0 ? '+' : '';
  const unitStr = units ? ` ${units}` : '';
  return `${sign}${formattedVal}${unitStr} / decade`;
}

/**
 * Splits a 95% confidence interval for decadal change into range and unit parts.
 * Enables clean 2-line rendering in compact table displays.
 */
export function formatConfidenceIntervalParts(
  lower: number | null | undefined,
  upper: number | null | undefined,
  units: string,
  isTemperature: boolean,
): { range: string; unit: string } {
  if (
    lower === null ||
    lower === undefined ||
    !Number.isFinite(lower) ||
    upper === null ||
    upper === undefined ||
    !Number.isFinite(upper)
  ) {
    return { range: '—', unit: '' };
  }

  const formatOne = (v: number) => {
    if (isTemperature) return (v > 0 ? '+' : '') + v.toFixed(1);
    const r = Math.round(v);
    const clean = Object.is(r, -0) ? 0 : r;
    return (clean > 0 ? '+' : '') + clean.toString();
  };

  const unitStr = units ? `${units} / decade` : '/ decade';
  return {
    range: `[${formatOne(lower)}, ${formatOne(upper)}]`,
    unit: unitStr,
  };
}

/**
 * Formats a 95% confidence interval for decadal change.
 * Temperature values keep 1 decimal place; all other values round to nearest integer.
 */
export function formatConfidenceInterval(
  lower: number | null | undefined,
  upper: number | null | undefined,
  units: string,
  isTemperature: boolean,
): string {
  const parts = formatConfidenceIntervalParts(lower, upper, units, isTemperature);
  if (parts.range === '—') {
    return '—';
  }
  return `${parts.range} ${parts.unit}`;
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
