export interface ITrendlineStats {
  /** Number of valid observation pairs used */
  n: number;
  /** Linear regression slope (units per x-step, e.g. units/year) */
  slope: number;
  /** Y-intercept */
  intercept: number;
  /** Pearson correlation coefficient (-1 to 1) */
  r: number;
  /** Coefficient of determination (r^2) */
  r2: number;
  /** Student's t-statistic for H0: rho = 0 */
  t: number;
  /** Two-tailed p-value */
  pValue: number;
  /** Whether the trend meets both significance and correlation thresholds */
  hasTrend: boolean;
  /** Earliest valid x value */
  startX: number;
  /** Latest valid x value */
  endX: number;
  /** Predicted y at startX */
  startY: number;
  /** Predicted y at endX */
  endY: number;
  /** Change per 10 x-units (e.g. change per decade when x is Year) */
  changePerDecade: number;
}

/**
 * Natural logarithm of the Gamma function via Lanczos approximation.
 */
export function logGamma(x: number): number {
  const p = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  x -= 1;
  let a = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) {
    a += p[i] / (x + i + 1);
  }
  const t = x + p.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * Continued fraction evaluation for the incomplete beta function (Lentz's method).
 */
function betaContinuedFraction(x: number, a: number, b: number): number {
  const maxIterations = 200;
  const epsilon = 1e-12;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < epsilon) break;
  }
  return h;
}

/**
 * Regularized incomplete beta function I_x(a, b).
 */
export function betainc(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const factor = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) {
    return (factor * betaContinuedFraction(x, a, b)) / a;
  } else {
    return 1 - (factor * betaContinuedFraction(1 - x, b, a)) / b;
  }
}

/**
 * Computes the two-tailed p-value for Student's t-distribution with df degrees of freedom.
 */
export function studentTPValue(t: number, df: number): number {
  if (df <= 0 || !Number.isFinite(df)) return 1;
  const absT = Math.abs(t);
  if (!Number.isFinite(absT)) return 0;
  if (absT === 0) return 1;
  const x = df / (df + absT * absT);
  const p = betainc(x, df / 2, 0.5);
  return Math.max(0, Math.min(1, p));
}

/**
 * Computes linear regression, Pearson correlation, and statistical significance.
 *
 * @param points Array of { x, y } pairs
 * @param pThreshold Significance threshold (default 0.05)
 * @param rThreshold Correlation magnitude threshold (default 0.30)
 */
export function calculateLinearRegression(
  points: { x: number; y: number }[],
  pThreshold = 0.05,
  rThreshold = 0.3,
): ITrendlineStats {
  const defaultEmpty: ITrendlineStats = {
    n: 0,
    slope: 0,
    intercept: 0,
    r: 0,
    r2: 0,
    t: 0,
    pValue: 1,
    hasTrend: false,
    startX: 0,
    endX: 0,
    startY: 0,
    endY: 0,
    changePerDecade: 0,
  };

  if (!points || points.length === 0) return defaultEmpty;

  const valid = points
    .filter((p) => typeof p.x === 'number' && Number.isFinite(p.x) && typeof p.y === 'number' && Number.isFinite(p.y))
    .sort((a, b) => a.x - b.x);

  const n = valid.length;
  if (n < 3) {
    return {
      ...defaultEmpty,
      n,
      startX: n > 0 ? valid[0].x : 0,
      endX: n > 0 ? valid[n - 1].x : 0,
    };
  }

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += valid[i].x;
    sumY += valid[i].y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let ssXX = 0;
  let ssYY = 0;
  let ssXY = 0;
  for (let i = 0; i < n; i++) {
    const dx = valid[i].x - meanX;
    const dy = valid[i].y - meanY;
    ssXX += dx * dx;
    ssYY += dy * dy;
    ssXY += dx * dy;
  }

  const startX = valid[0].x;
  const endX = valid[n - 1].x;

  // Zero variance in X or Y
  if (ssXX < 1e-12 || ssYY < 1e-12) {
    return {
      n,
      slope: 0,
      intercept: meanY,
      r: 0,
      r2: 0,
      t: 0,
      pValue: 1,
      hasTrend: false,
      startX,
      endX,
      startY: meanY,
      endY: meanY,
      changePerDecade: 0,
    };
  }

  const slope = ssXY / ssXX;
  const intercept = meanY - slope * meanX;
  const rawR = ssXY / Math.sqrt(ssXX * ssYY);
  const r = Math.max(-1, Math.min(1, rawR));
  const r2 = r * r;

  const df = n - 2;
  let t = 0;
  let pValue = 1;

  if (Math.abs(r) >= 0.999999) {
    t = r > 0 ? Infinity : -Infinity;
    pValue = 0;
  } else {
    t = r * Math.sqrt(df / (1 - r2));
    pValue = studentTPValue(t, df);
  }

  const hasTrend = pValue < pThreshold && Math.abs(r) >= rThreshold;
  const startY = slope * startX + intercept;
  const endY = slope * endX + intercept;
  const changePerDecade = slope * 10;

  return {
    n,
    slope,
    intercept,
    r,
    r2,
    t,
    pValue,
    hasTrend,
    startX,
    endX,
    startY,
    endY,
    changePerDecade,
  };
}
