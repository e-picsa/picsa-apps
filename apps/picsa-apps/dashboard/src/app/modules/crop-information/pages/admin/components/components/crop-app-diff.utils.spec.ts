// eslint-disable-next-line @nx/enforce-module-boundaries
import type { IStationCropData } from '@picsa/crop-probability/src/app/models';

import {
  deepEqualJson,
  findDifferingCrops,
  locationIdFromAppId,
  summarizeProbabilityTable,
} from './crop-app-diff.utils';

describe('locationIdFromAppId', () => {
  it('should return the last path segment', () => {
    expect(locationIdFromAppId('eastern/chipata')).toBe('chipata');
    expect(locationIdFromAppId('masvingo')).toBe('masvingo');
  });
});

describe('summarizeProbabilityTable', () => {
  it('should count crops and variety entries', () => {
    const table = [
      { crop: 'maize', data: [{ variety: 'DK777' }, { variety: 'SC-419' }] },
      { crop: 'sorghum', data: [{ variety: 'Local' }] },
    ] as IStationCropData[];
    expect(summarizeProbabilityTable(table)).toEqual({ crops: 2, varieties: 3, cropNames: ['maize', 'sorghum'] });
  });

  it('should handle missing tables', () => {
    expect(summarizeProbabilityTable(null)).toEqual({ crops: 0, varieties: 0, cropNames: [] });
    expect(summarizeProbabilityTable(undefined)).toEqual({ crops: 0, varieties: 0, cropNames: [] });
  });
});

describe('deepEqualJson', () => {
  it('should compare primitives and null', () => {
    expect(deepEqualJson(1, 1)).toBe(true);
    expect(deepEqualJson(1, 2)).toBe(false);
    expect(deepEqualJson('a', 'a')).toBe(true);
    expect(deepEqualJson(null, null)).toBe(true);
    expect(deepEqualJson(null, undefined)).toBe(false);
  });

  it('should compare arrays order-sensitively', () => {
    expect(deepEqualJson([1, 2], [1, 2])).toBe(true);
    expect(deepEqualJson([1, 2], [2, 1])).toBe(false);
    expect(deepEqualJson([1], [1, 2])).toBe(false);
  });

  it('should compare objects order-insensitively', () => {
    expect(deepEqualJson({ a: 1, b: [1, 2] }, { b: [1, 2], a: 1 })).toBe(true);
    expect(deepEqualJson({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqualJson({ a: 1 }, { a: 2 })).toBe(false);
  });
});

describe('findDifferingCrops', () => {
  const cropEntry = (crop: string, probabilities: (number | null)[]): IStationCropData =>
    ({ crop, data: [{ variety: 'V1', probabilities }] }) as IStationCropData;

  it('should return empty when tables match', () => {
    const table = [cropEntry('maize', [1, 0.5])];
    expect(findDifferingCrops(table, [cropEntry('maize', [1, 0.5])])).toEqual([]);
  });

  it('should identify only the crops that differ, including one-sided crops', () => {
    const app = [cropEntry('maize', [1, 0.5]), cropEntry('sorghum', [0.2])];
    const expected = [cropEntry('maize', [1, 0.9]), cropEntry('cotton', [0.3])];
    expect(findDifferingCrops(app, expected)).toEqual(['cotton', 'maize', 'sorghum']);
  });
});
