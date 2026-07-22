import { findSurroundingKeys, getCropSuccessProbability, linearInterpolationStrategy } from './probability.utils';

describe('probability.utils', () => {
  describe('findSurroundingKeys', () => {
    const keys = [45, 75, 105, 135, 165];

    it('should find exact match', () => {
      expect(findSurroundingKeys(75, keys)).toEqual({ lower: 75, upper: 75 });
    });

    it('should find boundaries when out of bounds', () => {
      expect(findSurroundingKeys(30, keys)).toEqual({ lower: 45, upper: 45 });
      expect(findSurroundingKeys(180, keys)).toEqual({ lower: 165, upper: 165 });
    });

    it('should find surrounding bounds for midpoint values', () => {
      expect(findSurroundingKeys(60, keys)).toEqual({ lower: 45, upper: 75 });
      expect(findSurroundingKeys(120, keys)).toEqual({ lower: 105, upper: 135 });
    });
  });

  describe('linearInterpolationStrategy', () => {
    it('should return exact lower when keys are same', () => {
      expect(linearInterpolationStrategy(75, 75, 75, 0.8, 0.8)).toBe(0.8);
    });

    it('should interpolate midpoints exactly', () => {
      expect(linearInterpolationStrategy(60, 45, 75, 0.4, 0.8)).toBeCloseTo(0.6);
    });

    it('should interpolate other fractions correctly', () => {
      expect(linearInterpolationStrategy(55, 45, 75, 0.3, 0.9)).toBeCloseTo(0.5);
    });
  });

  describe('getCropSuccessProbability', () => {
    const mockHashmap = {
      250: {
        45: { 100: 0.2, 200: 0.4 },
        75: { 100: 0.6, 200: 0.8 },
      },
    };

    it('should interpolate successfully for midpoint plant length', () => {
      const result = getCropSuccessProbability(250, 60, [100, 200], mockHashmap);
      // days_lower = 60 is halfway between 45 and 75
      // 100: 0.2 and 0.6 -> midpoint 0.4
      // 200: 0.4 and 0.8 -> midpoint 0.6
      expect(result[0]).toBeCloseTo(0.4);
      expect(result[1]).toBeCloseTo(0.6);
    });

    it('should return undefined if water requirement does not exist', () => {
      const result = getCropSuccessProbability(500, 60, [100, 200], mockHashmap);
      expect(result).toEqual([undefined, undefined]);
    });

    it('should fall back to nearest boundary if one of the values is missing (sparse data)', () => {
      const sparseHashmap = {
        250: {
          45: { 100: 0.2 },
          75: { 200: 0.8 },
        },
      };
      const result = getCropSuccessProbability(250, 60, [100, 200], sparseHashmap);
      expect(result[0]).toBe(0.2);
      expect(result[1]).toBe(0.8);
    });
  });
});
