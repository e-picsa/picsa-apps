import type { IGeolocationData } from '@picsa/data/geoLocation';

import { filterLocationsToProbabilityTables } from './location-filter.utils';

const TABLE = (id: string, label = id) => ({ id, label });

const baseData = (layers: IGeolocationData['layers']): IGeolocationData => ({
  topoJson: async () => ({}) as never,
  layers,
});

describe('filterLocationsToProbabilityTables', () => {
  describe('single-layer geo data (e.g. mw)', () => {
    const mwData = () =>
      baseData([
        {
          key: 'district',
          label: 'District',
          locations: [
            { id: 'lilongwe', label: 'Lilongwe' },
            { id: 'dowa', label: 'Dowa' },
            { id: 'karonga', label: 'Karonga' },
          ],
        },
      ]);
    const tables = [TABLE('lilongwe', 'Lilongwe'), TABLE('dowa', 'Dowa')];

    it('should only filter districts when max one table per district', () => {
      const result = filterLocationsToProbabilityTables(mwData(), tables);
      expect(result.layers[0].locations.map((v) => v.id)).toEqual(['lilongwe', 'dowa']);
      expect(result.layers).toHaveLength(1);
    });

    it('should synthesise a sublocation layer when a district has multiple tables', () => {
      const multiTables = [
        TABLE('lilongwe', 'Lilongwe'),
        TABLE('dowa/boma_met_station', 'Boma'),
        TABLE('dowa/mvera_met_station', 'Mvera'),
      ];
      const result = filterLocationsToProbabilityTables(mwData(), multiTables);
      expect(result.layers[0].locations.map((v) => v.id)).toEqual(['lilongwe', 'dowa']);
      expect(result.layers[1]?.locations).toEqual([
        { id: 'lilongwe', parentId: 'lilongwe', label: 'Lilongwe' },
        { id: 'boma_met_station', parentId: 'dowa', label: 'Boma' },
        { id: 'mvera_met_station', parentId: 'dowa', label: 'Mvera' },
      ]);
    });

    it('should not mutate the input data', () => {
      const input = mwData();
      filterLocationsToProbabilityTables(input, tables);
      expect(input.layers[0].locations).toHaveLength(3);
      expect(input.layers).toHaveLength(1);
    });

    it('should return identical results when run repeatedly on the same input', () => {
      // regression: overlay recreates the location select on every open, re-running
      // the filter on shared geo data. Previously the second run wiped mw sublocations
      const input = mwData();
      const first = filterLocationsToProbabilityTables(input, tables);
      const second = filterLocationsToProbabilityTables(input, tables);
      expect(second).toEqual(first);
      expect(second.layers[0].locations).toHaveLength(2);
    });
  });

  describe('multi-layer geo data (e.g. zm)', () => {
    const zmData = () =>
      baseData([
        {
          key: 'province',
          label: 'Province',
          locations: [
            { id: 'central', label: 'Central' },
            { id: 'southern', label: 'Southern' },
            { id: 'eastern', label: 'Eastern' },
          ],
        },
        {
          key: 'district',
          label: 'District',
          locations: [
            { id: 'kabwe', label: 'Kabwe', parentId: 'central' },
            { id: 'mazabuka', label: 'Mazabuka', parentId: 'southern' },
            { id: 'chipata', label: 'Chipata', parentId: 'eastern' },
          ],
        },
      ]);
    const tables = [
      TABLE('central/kabwe', 'Kabwe'),
      TABLE('southern/mazabuka--kafue-polder', 'Kafue Polder'),
      TABLE('southern/mazabuka--magoye-agromet', 'Magoye Agromet'),
    ];

    it('should filter layers and append sublocation entries for tables sharing a district', () => {
      const result = filterLocationsToProbabilityTables(zmData(), tables);
      expect(result.layers[0].locations.map((v) => v.id)).toEqual(['central', 'southern']);
      expect(result.layers[1]?.locations.map((v) => v.id)).toEqual([
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
      expect(input.layers[1]?.locations).toHaveLength(3);
      expect(second.layers[1]?.locations).toHaveLength(4);
    });
  });
});
