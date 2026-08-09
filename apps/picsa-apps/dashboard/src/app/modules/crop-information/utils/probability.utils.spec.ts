// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  getDaysBounds,
  groupAndSortCropDataItems,
} from '@picsa/crop-probability/src/app/utils/probability-table.utils';

import {
  findSurroundingKeys,
  getCropSuccessProbability,
  interpolateValue,
  linearInterpolationStrategy,
} from './probability.utils';

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

  describe('interpolateValue', () => {
    it('should interpolate using strategy when both values are numbers', () => {
      expect(interpolateValue(325, 300, 350, 0.4, 0.8)).toBeCloseTo(0.6);
    });

    it('should fall back to valLower when valUpper is undefined', () => {
      expect(interpolateValue(325, 300, 350, 0.4, undefined)).toBe(0.4);
    });

    it('should fall back to valUpper when valLower is undefined', () => {
      expect(interpolateValue(325, 300, 350, undefined, 0.8)).toBe(0.8);
    });

    it('should return undefined when both values are undefined', () => {
      expect(interpolateValue(325, 300, 350, undefined, undefined)).toBeUndefined();
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

    it('should return undefined if probability hashmap is empty', () => {
      const result = getCropSuccessProbability(500, 60, [100, 200], {});
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

    it('should interpolate successfully for 50mm increment lookup tables (weighted average over water)', () => {
      // Lookup table available only in 50mm increments: 300 and 350
      const hashmap50mm = {
        300: {
          60: { 100: 0.4, 200: 0.6 },
        },
        350: {
          60: { 100: 0.8, 200: 1.0 },
        },
      };
      // Target water requirement is 325 (midpoint between 300 and 350)
      const resultMidpoint = getCropSuccessProbability(325, 60, [100, 200], hashmap50mm);
      expect(resultMidpoint[0]).toBeCloseTo(0.6);
      expect(resultMidpoint[1]).toBeCloseTo(0.8);

      // Target water requirement is 320 (40% between 300 and 350)
      const resultFraction = getCropSuccessProbability(320, 60, [100, 200], hashmap50mm);
      expect(resultFraction[0]).toBeCloseTo(0.56);
      expect(resultFraction[1]).toBeCloseTo(0.76);
    });

    it('should cap at nearest water boundary when water requirement is out of bounds', () => {
      const hashmap50mm = {
        300: {
          60: { 100: 0.4, 200: 0.6 },
        },
        350: {
          60: { 100: 0.8, 200: 1.0 },
        },
      };
      // Below min key (250 < 300) -> returns probabilities for 300
      const resultBelow = getCropSuccessProbability(250, 60, [100, 200], hashmap50mm);
      expect(resultBelow).toEqual([0.4, 0.6]);

      // Above max key (400 > 350) -> returns probabilities for 350
      const resultAbove = getCropSuccessProbability(400, 60, [100, 200], hashmap50mm);
      expect(resultAbove).toEqual([0.8, 1.0]);
    });
  });

  describe('getDaysBounds', () => {
    it('should use numeric days_lower and days_upper directly', () => {
      expect(getDaysBounds({ variety: 'V1', days: '130 - 135', days_lower: 130, days_upper: 135 })).toEqual({
        minDays: 130,
        maxDays: 135,
        midpoint: 132.5,
      });
    });

    it('should fallback to parsing string if numeric properties are missing', () => {
      expect(getDaysBounds({ variety: 'V1', days: '90' })).toEqual({
        minDays: 90,
        maxDays: 90,
        midpoint: 90,
      });
      expect(getDaysBounds({ variety: 'V1', days: '130 - 135' })).toEqual({
        minDays: 130,
        maxDays: 135,
        midpoint: 132.5,
      });
    });
  });

  describe('groupAndSortCropDataItems', () => {
    it('should group items with identical water and probability requirements into a single row', () => {
      const input = [
        {
          variety: 'SC600',
          days: '130',
          days_lower: 130,
          days_upper: 130,
          water: [364],
          probabilities: [0.6, 0.2, 0, 0],
        },
        {
          variety: 'PHB 30 G 19',
          days: '135',
          days_lower: 135,
          days_upper: 135,
          water: [364],
          probabilities: [0.6, 0.2, 0, 0],
        },
      ];

      const result = groupAndSortCropDataItems(input);
      expect(result.length).toBe(1);
      expect(result[0].variety).toBe('SC600, PHB 30 G 19');
      expect(result[0].days).toBe('130 - 135');
      expect(result[0].days_lower).toBe(130);
      expect(result[0].days_upper).toBe(135);
      expect(result[0].water).toEqual([364]);
      expect(result[0].probabilities).toEqual([0.6, 0.2, 0, 0]);
    });

    it('should sort grouped items in ascending order of days midpoint', () => {
      const input = [
        {
          variety: 'Late Variety',
          days: '130 - 135',
          days_lower: 130,
          days_upper: 135,
          water: [364],
          probabilities: [0.6, 0.2, 0, 0],
        },
        {
          variety: 'Early Variety',
          days: '90',
          days_lower: 90,
          days_upper: 90,
          water: [252],
          probabilities: [1, 1, 0.8, 0.6],
        },
        {
          variety: 'Medium Variety',
          days: '110',
          days_lower: 110,
          days_upper: 110,
          water: [308],
          probabilities: [1, 0.8, 0.5, 0.1],
        },
      ];

      const result = groupAndSortCropDataItems(input);
      expect(result.map((r) => r.variety)).toEqual(['Early Variety', 'Medium Variety', 'Late Variety']);
      expect(result.map((r) => r.days)).toEqual(['90', '110', '130 - 135']);
    });
  });
});
