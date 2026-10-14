import type { IGeolocationData } from '@picsa/data/geoLocation';

import { filterLocationsToProbabilityTables } from './location-filter.utils';

const TABLE = (id: string, label = id) => ({ id, label });

const baseData = (overrides?: Partial<IGeolocationData>): IGeolocationData => ({
  topoJson: async () => ({}) as never,
  admin_4: { label: 'District', locations: [] },
  ...overrides,
});

describe('filterLocationsToProbabilityTables', () => {
  describe('single-tier geo data (e.g. mw)', () => {
    const mwData = () =>
      baseData({
        admin_4: {
          label: 'District',
          locations: [
            { id: 'lilongwe', label: 'Lilongwe' },
            { id: 'dowa', label: 'Dowa' },
            { id: 'karonga', label: 'Karonga' },
          ],
        },
      });
    const tables = [TABLE('lilongwe', 'Lilongwe'), TABLE('dowa', 'Dowa')];

    it('should only filter districts when max one table per district', () => {
      const result = filterLocationsToProbabilityTables(mwData(), tables);
      expect(result.admin_4.locations.map((v) => v.id)).toEqual(['lilongwe', 'dowa']);
      expect(result.admin_5).toBeUndefined();
    });

    it('should synthesise a sublocation tier when a district has multiple tables', () => {
      const multiTables = [
        TABLE('lilongwe', 'Lilongwe'),
        TABLE('dowa/boma_met_station', 'Boma'),
        TABLE('dowa/mvera_met_station', 'Mvera'),
      ];
      const result = filterLocationsToProbabilityTables(mwData(), multiTables);
      expect(result.admin_4.locations.map((v) => v.id)).toEqual(['lilongwe', 'dowa']);
      expect(result.admin_5?.locations).toEqual([
        { id: 'lilongwe', admin_4: 'lilongwe', label: 'Lilongwe' },
        { id: 'boma_met_station', admin_4: 'dowa', label: 'Boma' },
        { id: 'mvera_met_station', admin_4: 'dowa', label: 'Mvera' },
      ]);
    });

    it('should not mutate the input data', () => {
      const input = mwData();
      filterLocationsToProbabilityTables(input, tables);
      expect(input.admin_4.locations).toHaveLength(3);
      expect(input.admin_5).toBeUndefined();
    });

    it('should return identical results when run repeatedly on the same input', () => {
      // regression: overlay recreates the location select on every open, re-running
      // the filter on shared geo data. Previously the second run wiped mw sublocations
      const input = mwData();
      const first = filterLocationsToProbabilityTables(input, tables);
      const second = filterLocationsToProbabilityTables(input, tables);
      expect(second).toEqual(first);
      expect(second.admin_4.locations).toHaveLength(2);
    });
  });

  describe('multi-tier geo data (e.g. zm)', () => {
    const zmData = () =>
      baseData({
        admin_4: {
          label: 'Province',
          locations: [
            { id: 'central', label: 'Central' },
            { id: 'southern', label: 'Southern' },
            { id: 'eastern', label: 'Eastern' },
          ],
        },
        admin_5: {
          label: 'District',
          locations: [
            { id: 'kabwe', label: 'Kabwe', admin_4: 'central' },
            { id: 'mazabuka', label: 'Mazabuka', admin_4: 'southern' },
            { id: 'chipata', label: 'Chipata', admin_4: 'eastern' },
          ],
        },
      });
    const tables = [
      TABLE('central/kabwe', 'Kabwe'),
      TABLE('southern/mazabuka--kafue-polder', 'Kafue Polder'),
      TABLE('southern/mazabuka--magoye-agromet', 'Magoye Agromet'),
    ];

    it('should filter tiers and append sublocation entries for tables sharing a district', () => {
      const result = filterLocationsToProbabilityTables(zmData(), tables);
      expect(result.admin_4.locations.map((v) => v.id)).toEqual(['central', 'southern']);
      expect(result.admin_5?.locations.map((v) => v.id)).toEqual([
        'kabwe',
        'mazabuka',
        'southern/mazabuka--kafue-polder',
        'southern/mazabuka--magoye-agromet',
      ]);
    });

    it('should not mutate the input data or duplicate entries on repeated runs', () => {
      const input = zmData();
      filterLocationsToProbabilityTables(input, tables);
      const second = filterLocationsToProbabilityTables(input, tables);
      expect(input.admin_5?.locations).toHaveLength(3);
      expect(second.admin_5?.locations).toHaveLength(4);
    });
  });
});
