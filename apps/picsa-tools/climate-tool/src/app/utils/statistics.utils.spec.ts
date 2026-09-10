import { betainc, calculateLinearRegression, logGamma, studentTPValue } from './statistics.utils';

describe('statistics.utils', () => {
  describe('logGamma and betainc', () => {
    it('should compute logGamma accurately', () => {
      // Gamma(1) = 1 -> logGamma(1) = 0
      expect(Math.abs(logGamma(1))).toBeLessThan(1e-10);
      // Gamma(2) = 1 -> logGamma(2) = 0
      expect(Math.abs(logGamma(2))).toBeLessThan(1e-10);
      // Gamma(5) = 24 -> logGamma(5) = ln(24) approx 3.17805383
      expect(logGamma(5)).toBeCloseTo(Math.log(24), 8);
    });

    it('should compute betainc for boundary conditions', () => {
      expect(betainc(0, 2, 2)).toBe(0);
      expect(betainc(1, 2, 2)).toBe(1);
      // betainc(0.5, 1, 1) = 0.5
      expect(betainc(0.5, 1, 1)).toBeCloseTo(0.5, 6);
    });
  });

  describe('studentTPValue', () => {
    it('should calculate accurate two-tailed p-values for standard critical values', () => {
      // t = 2.042, df = 30 -> p approx 0.05
      const p1 = studentTPValue(2.042, 30);
      expect(p1).toBeCloseTo(0.05, 2);

      // t = 0 -> p = 1.0
      expect(studentTPValue(0, 20)).toBe(1);

      // large t -> p approaches 0
      expect(studentTPValue(10, 30)).toBeLessThan(1e-6);

      // invalid df
      expect(studentTPValue(2.0, 0)).toBe(1);
    });
  });

  describe('calculateLinearRegression', () => {
    it('should handle empty or small datasets safely', () => {
      const empty = calculateLinearRegression([]);
      expect(empty.hasTrend).toBe(false);
      expect(empty.n).toBe(0);
      expect(empty.pValue).toBe(1);

      const twoPoints = calculateLinearRegression([
        { x: 2000, y: 10 },
        { x: 2001, y: 20 },
      ]);
      expect(twoPoints.n).toBe(2);
      expect(twoPoints.hasTrend).toBe(false);
      expect(twoPoints.pValue).toBe(1);
    });

    it('should handle zero variance datasets safely', () => {
      const flat = calculateLinearRegression([
        { x: 2000, y: 15 },
        { x: 2001, y: 15 },
        { x: 2002, y: 15 },
      ]);
      expect(flat.slope).toBe(0);
      expect(flat.r).toBe(0);
      expect(flat.hasTrend).toBe(false);
      expect(flat.pValue).toBe(1);
    });

    it('should detect a strong significant upward trend', () => {
      // Linear data with small noise: y = 2 * x - 3980
      const points = [
        { x: 2000, y: 20 },
        { x: 2001, y: 22.1 },
        { x: 2002, y: 23.9 },
        { x: 2003, y: 26.2 },
        { x: 2004, y: 28.0 },
        { x: 2005, y: 30.1 },
        { x: 2006, y: 32.2 },
        { x: 2007, y: 33.9 },
        { x: 2008, y: 36.1 },
        { x: 2009, y: 38.0 },
      ];

      const res = calculateLinearRegression(points);
      expect(res.n).toBe(10);
      expect(res.slope).toBeCloseTo(2.0, 1);
      expect(res.r).toBeGreaterThan(0.95);
      expect(res.pValue).toBeLessThan(0.001);
      expect(res.hasTrend).toBe(true);
      expect(res.changePerDecade).toBeCloseTo(20.0, 0);
      expect(res.startX).toBe(2000);
      expect(res.endX).toBe(2009);
    });

    it('should detect when no strong trend exists (weak correlation or high p-value)', () => {
      // Fluctuating points around mean with no trend
      const points = [
        { x: 2000, y: 500 },
        { x: 2001, y: 520 },
        { x: 2002, y: 480 },
        { x: 2003, y: 510 },
        { x: 2004, y: 495 },
        { x: 2005, y: 505 },
        { x: 2006, y: 490 },
        { x: 2007, y: 515 },
        { x: 2008, y: 485 },
        { x: 2009, y: 502 },
      ];

      const res = calculateLinearRegression(points);
      expect(res.n).toBe(10);
      expect(Math.abs(res.r)).toBeLessThan(0.3);
      expect(res.pValue).toBeGreaterThan(0.05);
      expect(res.hasTrend).toBe(false);
    });

    it('should respect custom pThreshold and rThreshold', () => {
      // Moderate correlation r approx 0.35, p approx 0.3
      const points = [
        { x: 2000, y: 10 },
        { x: 2001, y: 12 },
        { x: 2002, y: 11 },
        { x: 2003, y: 14 },
        { x: 2004, y: 13 },
      ];

      const strict = calculateLinearRegression(points, 0.01, 0.8);
      expect(strict.hasTrend).toBe(false);

      const lenient = calculateLinearRegression(points, 0.5, 0.2);
      expect(lenient.hasTrend).toBe(true);
    });
  });
});
