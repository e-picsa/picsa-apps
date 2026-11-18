// eslint-disable-next-line @nx/enforce-module-boundaries
import type { IStationCropData } from '@picsa/crop-probability/src/app/models';

import {
  buildCombinedDiffTable,
  calcProbabilityChangePct,
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

describe('buildCombinedDiffTable', () => {
  it('should build a combined table highlighting ungrouped varieties, changed probabilities, and removed rows', () => {
    const app = [
      {
        crop: 'maize',
        data: [
          { variety: 'SC-719, GANKATA', days: '140 - 155', water: [630], probabilities: [0.1, 0] },
          { variety: 'SC-727', days: '150 - 155', water: [615], probabilities: [0.4, 0.1] },
        ],
      },
      {
        crop: 'beans',
        data: [{ variety: 'NUA', days: '70', water: [195], probabilities: [1, 1] }],
      },
    ] as IStationCropData[];

    const expected = [
      {
        crop: 'maize',
        data: [{ variety: 'SC-719', days: '140 - 145', water: [630], probabilities: [0.2, 0] }],
      },
      {
        crop: 'beans',
        data: [{ variety: 'NUA', days: '70', water: [195], probabilities: [1, 1] }],
      },
    ] as IStationCropData[];

    const { stationData, cellDiffs } = buildCombinedDiffTable({
      app,
      expected,
      appSeasonProbabilities: [0.5, 0.8],
      dbSeasonProbabilities: [0.6, 0.8],
    });

    // Only maize differs; beans matches and is omitted
    expect(stationData.map((c) => c.crop)).toEqual(['maize']);
    expect(stationData[0].data.map((d) => d.variety)).toEqual(['SC-719', 'SC-727']);
    expect(cellDiffs['__season__']).toEqual({ prob_0: 'Was: 5/10' });
    expect(cellDiffs['maize/SC-719']).toEqual({
      variety: 'Was: SC-719, GANKATA',
      days: 'Was: 140 - 155',
      prob_0: 'Was: 1/10',
    });
    expect(cellDiffs['maize/SC-727']).toEqual({
      variety: 'Removed from DB (was: SC-727)',
      days: 'Removed (was: 150 - 155)',
      water: 'Removed (was: 615 mm)',
      prob_0: 'Removed (was: 4/10)',
      prob_1: 'Removed (was: 1/10)',
    });
  });
});

describe('calcProbabilityChangePct', () => {
  it('should return 0% when retained varieties have identical probabilities despite exclusions', () => {
    const app = [
      {
        crop: 'maize',
        data: [
          { variety: 'SC-419', days: '110', water: [400], probabilities: [0.8, 0.6] },
          { variety: 'SC-727', days: '155', water: [600], probabilities: [0.4, 0.1] },
        ],
      },
    ] as IStationCropData[];
    const expected = [
      { crop: 'maize', data: [{ variety: 'SC-419', days: '110', water: [400], probabilities: [0.8, 0.6] }] },
    ] as IStationCropData[];
    expect(calcProbabilityChangePct(app, expected)).toBe(0);
  });

  it('should return exact percentage of changed probability cells', () => {
    const app = [
      { crop: 'maize', data: [{ variety: 'SC-419', days: '110', water: [400], probabilities: [0.8, 0.6, 0.4, 0.2] }] },
    ] as IStationCropData[];
    const expected = [
      { crop: 'maize', data: [{ variety: 'SC-419', days: '110', water: [400], probabilities: [0.9, 0.6, 0.4, 0.2] }] },
    ] as IStationCropData[];
    expect(calcProbabilityChangePct(app, expected)).toBe(25);
    expect(calcProbabilityChangePct(null, expected)).toBeNull();
  });
});
