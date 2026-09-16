import {
  calculateConfidenceInterval,
  calculateCriticalT,
  calculateLinearRegression,
  calculateSignificance,
  checkConsecutiveYears,
  fitLinearRegression,
  formatConfidenceInterval,
  formatDecadeRate,
  formatPValue,
  MIN_OBSERVATIONS_30_YEAR,
  MIN_OBSERVATIONS_FULL,
} from './statistics.utils';

describe('statistics.utils (OLS Regression, Inference & Confidence Intervals)', () => {
  describe('checkConsecutiveYears', () => {
    it('should return true for consecutive series or small arrays', () => {
      expect(checkConsecutiveYears([])).toBe(true);
      expect(checkConsecutiveYears([{ x: 2000 }])).toBe(true);
      expect(checkConsecutiveYears([{ x: 2000 }, { x: 2001 }, { x: 2002 }])).toBe(true);
    });

    it('should return false if there are gaps in x values', () => {
      expect(checkConsecutiveYears([{ x: 2000 }, { x: 2002 }])).toBe(false);
      expect(checkConsecutiveYears([{ x: 1990 }, { x: 1991 }, { x: 1993 }, { x: 1994 }])).toBe(false);
    });
  });

  describe('fitLinearRegression (simple-statistics OLS)', () => {
    it('should calculate accurate slope, intercept, endpoints, and correlation metrics', () => {
      // Points on line: y = 2x + 10
      const points = [
        { x: 2000, y: 4010 },
        { x: 2001, y: 4012 },
        { x: 2002, y: 4014 },
        { x: 2003, y: 4016 },
        { x: 2004, y: 4018 },
      ];

      const fit = fitLinearRegression(points);
      expect(fit).not.toBeNull();
      expect(fit?.slope).toBeCloseTo(2, 4);
      expect(fit?.intercept).toBeCloseTo(10, 4);
      expect(fit?.startX).toBe(2000);
      expect(fit?.endX).toBe(2004);
      expect(fit?.startY).toBeCloseTo(4010, 4);
      expect(fit?.endY).toBeCloseTo(4018, 4);
      expect(fit?.r).toBeCloseTo(1, 4);
      expect(fit?.rSquared).toBeCloseTo(1, 4);
      expect(fit?.changePerDecade).toBeCloseTo(20, 4);
    });

    it('should handle flat constant Y values gracefully without NaN', () => {
      const flatPoints = [
        { x: 2000, y: 50 },
        { x: 2001, y: 50 },
        { x: 2002, y: 50 },
      ];

      const fit = fitLinearRegression(flatPoints);
      expect(fit).not.toBeNull();
      expect(fit?.slope).toBe(0);
      expect(fit?.intercept).toBe(50);
      expect(fit?.startY).toBe(50);
      expect(fit?.endY).toBe(50);
      expect(fit?.r).toBeNull();
      expect(fit?.rSquared).toBeNull();
      expect(fit?.changePerDecade).toBe(0);
    });

    it('should return null for constant X values (vertical line / zero variance in time)', () => {
      const verticalPoints = [
        { x: 2000, y: 10 },
        { x: 2000, y: 20 },
      ];

      const fit = fitLinearRegression(verticalPoints);
      expect(fit).toBeNull();
    });

    it('should return null for fewer than 2 points', () => {
      expect(fitLinearRegression([])).toBeNull();
      expect(fitLinearRegression([{ x: 2000, y: 10 }])).toBeNull();
    });
  });

  describe('calculateSignificance (@stdlib/stats-base-dists-t-cdf)', () => {
    it('should calculate accurate two-tailed p-values for given correlation and sample size', () => {
      // For n = 30, df = 28:
      // When r = 0 -> t = 0 -> p = 1.0
      const sigZero = calculateSignificance(0, 30);
      expect(sigZero.tStat).toBe(0);
      expect(sigZero.df).toBe(28);
      expect(sigZero.pValue).toBe(1.0);

      // Moderate positive correlation
      const sigMod = calculateSignificance(0.5, 30);
      expect(sigMod.df).toBe(28);
      expect(sigMod.tStat).toBeCloseTo(3.055, 3);
      expect(sigMod.pValue).toBeLessThan(0.01);

      // Strong correlation (p approaches 0)
      const sigStrong = calculateSignificance(0.85, 30);
      expect(sigStrong.pValue).toBeLessThan(0.0001);

      // Perfect correlation
      const sigPerf = calculateSignificance(1.0, 30);
      expect(sigPerf.pValue).toBe(0);

      // Negative correlation (symmetric p-value)
      const sigNeg = calculateSignificance(-0.5, 30);
      expect(sigNeg.pValue).toBeCloseTo(sigMod.pValue ?? 0, 6);
    });

    it('should return nulls for invalid inputs or small sample sizes (n < 3)', () => {
      expect(calculateSignificance(null, 30)).toEqual({ tStat: null, df: null, pValue: null });
      expect(calculateSignificance(0.5, 2)).toEqual({ tStat: null, df: null, pValue: null });
      expect(calculateSignificance(NaN, 20)).toEqual({ tStat: null, df: null, pValue: null });
    });
  });

  describe('calculateCriticalT and calculateConfidenceInterval', () => {
    it('should compute accurate t-critical values using bisection on Student t CDF', () => {
      // For df = 28, two-tailed alpha = 0.05, t_crit is approx 2.0484
      const tCrit28 = calculateCriticalT(28, 0.05);
      expect(tCrit28).toBeCloseTo(2.048, 2);

      // As df -> infinity, t_crit approaches 1.960
      const tCritLarge = calculateCriticalT(1000, 0.05);
      expect(tCritLarge).toBeCloseTo(1.96, 2);
    });

    it('should calculate 95% confidence interval for decadal change', () => {
      // 30 points: y = 2x + 10 (perfect fit, zero residuals)
      const points = Array.from({ length: 30 }, (_, i) => ({
        x: 1990 + i,
        y: 10 + 2 * (1990 + i),
      }));

      const ci = calculateConfidenceInterval(points, 2, 10, 28, 0.05);
      expect(ci.seSlope).toBeCloseTo(0, 5);
      // Slope is 2 -> changePerDecade is 20 -> CI is [20, 20]
      expect(ci.ciLowerDecade).toBeCloseTo(20, 4);
      expect(ci.ciUpperDecade).toBeCloseTo(20, 4);
    });

    it('should return null CI for invalid parameters', () => {
      expect(calculateConfidenceInterval([], null, null, null)).toEqual({
        ciLowerDecade: null,
        ciUpperDecade: null,
        seSlope: null,
        tCrit: null,
      });
    });
  });

  describe('formatDecadeRate and formatConfidenceInterval rounding', () => {
    it('should round non-temperature variables to nearest integer', () => {
      // Rainfall mm
      expect(formatDecadeRate(14.4, 'mm', false)).toBe('+14 mm / decade');
      expect(formatDecadeRate(14.6, 'mm', false)).toBe('+15 mm / decade');
      expect(formatDecadeRate(-8.2, 'mm', false)).toBe('-8 mm / decade');
      expect(formatDecadeRate(-0.1, 'mm', false)).toBe('0 mm / decade'); // Avoid -0

      expect(formatConfidenceInterval(2.8, 25.3, 'mm', false)).toBe('[+3, +25] mm / decade');
      expect(formatConfidenceInterval(-10.4, 5.2, 'mm', false)).toBe('[-10, +5] mm / decade');
    });

    it('should format temperature variables to 1 decimal place', () => {
      // Temperature °C
      expect(formatDecadeRate(0.38, '°C', true)).toBe('+0.4 °C / decade');
      expect(formatDecadeRate(-0.24, '°C', true)).toBe('-0.2 °C / decade');

      expect(formatConfidenceInterval(0.12, 0.68, '°C', true)).toBe('[+0.1, +0.7] °C / decade');
      expect(formatConfidenceInterval(-0.15, 0.45, '°C', true)).toBe('[-0.1, +0.5] °C / decade');
    });

    it('should handle null / non-finite values safely', () => {
      expect(formatDecadeRate(null, 'mm', false)).toBe('—');
      expect(formatConfidenceInterval(null, null, 'mm', false)).toBe('—');
    });
  });

  describe('calculateLinearRegression (application wrapper & guardrails)', () => {
    it('should require at least 20 observations for full record', () => {
      // 19 observations (1 fewer than MIN_OBSERVATIONS_FULL)
      const shortRecord = Array.from({ length: 19 }, (_, i) => ({
        x: 2000 + i,
        y: 100 + i * 5, // strong trend
      }));

      const res = calculateLinearRegression(shortRecord, 'full');
      expect(res.n).toBe(19);
      expect(res.status).toBe('insufficient_data');
      expect(res.shouldPlotLine).toBe(false);
      expect(res.message).toBe('Insufficient data');
      expect(res.subtext).toContain(`Requires at least ${MIN_OBSERVATIONS_FULL} usable years`);

      // Descriptive stats are still populated in the returned object
      expect(res.slope).toBeCloseTo(5, 4);
      expect(res.r).toBeCloseTo(1, 4);
      expect(res.changePerDecade).toBeCloseTo(50, 4);
    });

    it('should tolerate occasional gaps in data (e.g. missing 1 year in 75 years like Chipata met)', () => {
      // 74 observations over 75 years (e.g. 1950 to 2024, with 1985 missing)
      const chipataRecord = Array.from({ length: 75 }, (_, i) => 1950 + i)
        .filter((yr) => yr !== 1985)
        .map((yr, idx) => ({
          x: yr,
          y: 800 + idx * 3, // upward trend
        }));

      expect(chipataRecord.length).toBe(74);

      const res = calculateLinearRegression(chipataRecord, 'full');
      expect(res.n).toBe(74);
      expect(res.status).toBe('upward_trend');
      expect(res.shouldPlotLine).toBe(true);
      expect(res.pValue).toBeLessThan(0.05);
      expect(res.ciLowerDecade).toBeGreaterThan(0);
    });

    it('should report insufficient data if full record has less than 70% completeness', () => {
      // 20 observations scattered across 100 years (20% completeness)
      const sparseRecord = Array.from({ length: 20 }, (_, i) => ({
        x: 1920 + i * 5,
        y: 100 + i * 2,
      }));

      const res = calculateLinearRegression(sparseRecord, 'full');
      expect(res.n).toBe(20);
      expect(res.status).toBe('insufficient_data');
      expect(res.shouldPlotLine).toBe(false);
      expect(res.subtext).toContain('less than 70% complete');
    });

    it('should support 30-year view slicing based on most recent 30-year window', () => {
      const longRecord = Array.from({ length: 50 }, (_, i) => ({
        x: 1970 + i,
        y: 50 + i * 1.5,
      }));

      const res30 = calculateLinearRegression(longRecord, '30_year');
      expect(res30.n).toBe(30);
      expect(res30.startX).toBe(1990);
      expect(res30.endX).toBe(2019);
      expect(res30.shouldPlotLine).toBe(true);
      expect(res30.status).toBe('upward_trend');
    });

    it('should report insufficient data for 30-year view when fewer than 20 observations are present', () => {
      // Only 15 observations in the 30-year window
      const record = Array.from({ length: 15 }, (_, i) => ({
        x: 2005 + i,
        y: 50 + i * 1.5,
      }));

      const res30 = calculateLinearRegression(record, '30_year');
      expect(res30.n).toBe(15);
      expect(res30.status).toBe('insufficient_data');
      expect(res30.shouldPlotLine).toBe(false);
      expect(res30.subtext).toContain(
        `Requires at least ${MIN_OBSERVATIONS_30_YEAR} usable years in the 30-year period`,
      );
    });

    it('should handle Constant X by reporting trend assessment unavailable', () => {
      const constantX = [
        { x: 2000, y: 10 },
        { x: 2000, y: 20 },
        { x: 2000, y: 30 },
      ];

      const res = calculateLinearRegression(constantX);
      expect(res.status).toBe('unavailable');
      expect(res.slope).toBeNull();
      expect(res.shouldPlotLine).toBe(false);
      expect(res.message).toBe('Unavailable');
      expect(res.subtext).toContain('Constant X values');
    });

    it('should handle Constant Y by suppressing line and reporting no clear trend', () => {
      const constantY = Array.from({ length: 25 }, (_, i) => ({
        x: 1995 + i,
        y: 42.0,
      }));

      const res = calculateLinearRegression(constantY);
      expect(res.status).toBe('no_clear_trend');
      expect(res.slope).toBe(0);
      expect(res.shouldPlotLine).toBe(false);
      expect(res.message).toBe('No clear trend');
    });

    it('should handle single point or empty input safely', () => {
      const empty = calculateLinearRegression([]);
      expect(empty.status).toBe('unavailable');
      expect(empty.shouldPlotLine).toBe(false);

      const single = calculateLinearRegression([{ x: 2000, y: 50 }]);
      expect(single.status).toBe('unavailable');
      expect(single.shouldPlotLine).toBe(false);
    });

    it('should filter out invalid, NaN, null, and incomplete observations', () => {
      const dirty = [
        { x: 1990, y: 10 },
        { x: 1991, y: NaN },
        { x: 1992, y: null as unknown as number },
        { x: NaN, y: 20 },
        { x: 1993, y: 15 },
      ];

      const res = calculateLinearRegression(dirty);
      expect(res.n).toBe(2); // Only 1990 and 1993 are valid numbers
      expect(res.startX).toBe(1990);
      expect(res.endX).toBe(1993);
    });

    it('should correctly classify significant upward and downward trends with solid lines', () => {
      const upPoints = Array.from({ length: 25 }, (_, i) => ({
        x: 1990 + i,
        y: 100 + 3 * i + (i % 2 === 0 ? 2 : -2),
      }));

      const resUp = calculateLinearRegression(upPoints);
      expect(resUp.status).toBe('upward_trend');
      expect(resUp.shouldPlotLine).toBe(true);
      expect(resUp.pValue).toBeLessThan(0.05);

      const downPoints = Array.from({ length: 25 }, (_, i) => ({
        x: 1990 + i,
        y: 200 - 4 * i + (i % 2 === 0 ? 2 : -2),
      }));

      const resDown = calculateLinearRegression(downPoints);
      expect(resDown.status).toBe('downward_trend');
      expect(resDown.shouldPlotLine).toBe(true);
      expect(resDown.pValue).toBeLessThan(0.05);
    });

    it('should classify non-significant trend as no_clear_trend and suppress trendline when p >= 0.05', () => {
      // Oscillating around 100 with zero/minimal trend
      const noisyPoints = Array.from({ length: 25 }, (_, i) => ({
        x: 1990 + i,
        y: 100 + (i % 2 === 0 ? 15 : -15),
      }));

      const res = calculateLinearRegression(noisyPoints);
      expect(res.status).toBe('no_clear_trend');
      expect(res.shouldPlotLine).toBe(false);
      expect(res.message).toBe('No clear trend');
      expect(res.pValue).toBeGreaterThanOrEqual(0.05);
    });
  });

  describe('formatPValue', () => {
    it('should format p-values cleanly', () => {
      expect(formatPValue(null)).toBe('—');
      expect(formatPValue(NaN)).toBe('—');
      expect(formatPValue(undefined)).toBe('—');
      expect(formatPValue(0.0004)).toBe('< 0.001');
      expect(formatPValue(0.024)).toBe('0.024');
      expect(formatPValue(0.05)).toBe('0.050');
      expect(formatPValue(0.1234)).toBe('0.123');
    });
  });
});
