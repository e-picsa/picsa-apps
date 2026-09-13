import {
  calculateLinearRegression,
  calculateSignificance,
  checkConsecutiveYears,
  fitLinearRegression,
  formatPValue,
  MIN_OBSERVATIONS_10_YEAR,
  MIN_OBSERVATIONS_30_YEAR,
  MIN_OBSERVATIONS_FULL,
} from './statistics.utils';

describe('statistics.utils (OLS Regression & Significance)', () => {
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
      expect(res.message).toBe('Not enough usable data to assess a trend.');
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
      expect(res.status).toBe('significant_up');
      expect(res.shouldPlotLine).toBe(true);
      expect(res.pValue).toBeLessThan(0.05);
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

    it('should support 10-year view and qualify when at least 7 out of 10 years are present', () => {
      // 10-year window where current year is missing: 8 valid years out of last 10
      const record = [
        ...Array.from({ length: 20 }, (_, i) => ({ x: 1990 + i, y: 100 + i })),
        { x: 2015, y: 120 },
        { x: 2016, y: 125 },
        { x: 2017, y: 130 },
        { x: 2018, y: 135 },
        { x: 2019, y: 140 },
        { x: 2020, y: 145 },
        { x: 2021, y: 150 },
        { x: 2023, y: 160 },
      ];

      const res10 = calculateLinearRegression(record, '10_year');
      expect(res10.n).toBe(8); // 8 out of last 10 years (>= 7)
      expect(res10.status).toBe('significant_up');
      expect(res10.shouldPlotLine).toBe(true);
      expect(res10.startX).toBe(2015);
      expect(res10.endX).toBe(2023);
    });

    it('should report insufficient data for 10-year view when fewer than 7 observations are present', () => {
      // Only 5 observations in the last 10 years
      const sparseRecent = [
        ...Array.from({ length: 30 }, (_, i) => ({ x: 1980 + i, y: 100 + i })),
        { x: 2019, y: 130 },
        { x: 2020, y: 132 },
        { x: 2021, y: 134 },
        { x: 2022, y: 136 },
        { x: 2023, y: 138 },
      ];

      const res10 = calculateLinearRegression(sparseRecent, '10_year');
      expect(res10.n).toBe(5);
      expect(res10.status).toBe('insufficient_data');
      expect(res10.shouldPlotLine).toBe(false);
      expect(res10.subtext).toContain(
        `Requires at least ${MIN_OBSERVATIONS_10_YEAR} usable years in the 10-year period`,
      );
      // Descriptive stats are still computed and returned
      expect(res10.slope).toBeCloseTo(2, 4);
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
      expect(res30.status).toBe('significant_up');
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
      expect(res.message).toBe('Trend assessment unavailable');
      expect(res.subtext).toContain('Constant X values');
    });

    it('should handle Constant Y by suppressing line and reporting no clear trend', () => {
      const constantY = Array.from({ length: 25 }, (_, i) => ({
        x: 1995 + i,
        y: 42.0,
      }));

      const res = calculateLinearRegression(constantY);
      expect(res.status).toBe('constant_y');
      expect(res.slope).toBe(0);
      expect(res.shouldPlotLine).toBe(false);
      expect(res.message).toBe('No clear trend detected for this period.');
    });

    it('should handle Two distinct x-values by returning fit stats but reporting insufficient data', () => {
      const twoPoints = [
        { x: 2000, y: 10 },
        { x: 2005, y: 20 },
      ];

      const res = calculateLinearRegression(twoPoints);
      expect(res.n).toBe(2);
      expect(res.status).toBe('insufficient_data');
      expect(res.shouldPlotLine).toBe(false);
      expect(res.slope).toBe(2);
      expect(res.changePerDecade).toBe(20);
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

    it('should correctly handle significant upward and downward trends', () => {
      const upPoints = Array.from({ length: 25 }, (_, i) => ({
        x: 1990 + i,
        y: 100 + 3 * i + (i % 2 === 0 ? 2 : -2),
      }));

      const resUp = calculateLinearRegression(upPoints);
      expect(resUp.status).toBe('significant_up');
      expect(resUp.shouldPlotLine).toBe(true);
      expect(resUp.pValue).toBeLessThan(0.05);

      const downPoints = Array.from({ length: 25 }, (_, i) => ({
        x: 1990 + i,
        y: 200 - 4 * i + (i % 2 === 0 ? 2 : -2),
      }));

      const resDown = calculateLinearRegression(downPoints);
      expect(resDown.status).toBe('significant_down');
      expect(resDown.shouldPlotLine).toBe(true);
      expect(resDown.pValue).toBeLessThan(0.05);
    });

    it('should classify non-significant trend as weak_trend when correlation is minimal (|r| < 0.15)', () => {
      // Oscillating around 100 with zero/minimal trend (|r| ~ 0)
      const weakPoints = Array.from({ length: 25 }, (_, i) => ({
        x: 1990 + i,
        y: 100 + (i % 2 === 0 ? 15 : -15),
      }));

      const res = calculateLinearRegression(weakPoints);
      expect(res.status).toBe('weak_trend');
      expect(res.shouldPlotLine).toBe(true);
      expect(res.message).toBe('Weak or minimal trend');
      expect(res.r).not.toBeNull();
      expect(Math.abs(res.r ?? 1)).toBeLessThan(0.15);
      expect(res.pValue).toBeGreaterThanOrEqual(0.05);
    });

    it('should classify non-significant trend as uncertain_trend when there is observable slope but p >= 0.05', () => {
      // Noticeable slope with high noise: |r| >= 0.15 but p >= 0.05
      const noisyTrend = Array.from({ length: 20 }, (_, i) => ({
        x: 2000 + i,
        y: 100 + i * 1.2 + (i % 3 === 0 ? 30 : -20),
      }));

      const res = calculateLinearRegression(noisyTrend);
      expect(res.status).toBe('uncertain_trend');
      expect(res.shouldPlotLine).toBe(true);
      expect(res.message).toContain('Uncertain');
      expect(Math.abs(res.r ?? 0)).toBeGreaterThanOrEqual(0.15);
      expect(res.pValue).toBeGreaterThanOrEqual(0.05);
    });
  });

  describe('formatPValue', () => {
    it('should format p-values cleanly', () => {
      expect(formatPValue(null)).toBe('—');
      expect(formatPValue(NaN)).toBe('—');
      expect(formatPValue(0.0001)).toBe('< 0.001');
      expect(formatPValue(0.042)).toBe('0.042');
      expect(formatPValue(0.1234)).toBe('0.123');
    });
  });
});
