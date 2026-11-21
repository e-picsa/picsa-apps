import type { IGeolocationData } from '@picsa/data/geoLocation';

import { filterLocationsToProbabilityTables, getTableLocationId } from './location-filter.utils';

const TABLE = (id: string, label = id, locationId?: string) => ({ id, label, locationId });

const baseData = (layers: IGeolocationData['layers']): IGeolocationData => {
  const leafKey = layers[layers.length - 1]?.key ?? '';
  return {
    topoJson: async () => ({}) as never,
    layers,
    toolLayers: { cropProbability: leafKey, forecast: leafKey, climate: leafKey },
  };
};

describe('filterLocationsToProbabilityTables', () => {
  it('filters single-layer geo data (e.g. mw) without mutating input', () => {
    const input = baseData([
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

    const first = filterLocationsToProbabilityTables(input, tables);
    const second = filterLocationsToProbabilityTables(input, tables);

    expect(first.layers[0].locations.map((v) => v.id)).toEqual(['lilongwe', 'dowa']);
    expect(second).toEqual(first);
    expect(input.layers[0].locations).toHaveLength(3);
  });

  it('filters multi-layer geo data (e.g. zm) and prunes empty parents without polluting geo layers', () => {
    const input = baseData([
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
        parentLayer: 'province',
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

    const result = filterLocationsToProbabilityTables(input, tables);
    expect(result.layers[0].locations.map((v) => v.id)).toEqual(['central', 'southern']);
    // District layer stays clean (no `--` pseudo-locations injected into geo layers)
    expect(result.layers[1].locations.map((v) => v.id)).toEqual(['kabwe', 'mazabuka']);
  });

  it('resolves explicit locationId ahead of id path parsing', () => {
    expect(getTableLocationId(TABLE('southern/mazabuka--kafue-polder', 'Kafue Polder'))).toBe('mazabuka');
    expect(getTableLocationId(TABLE('custom_id', 'Custom', 'chitsime_epa'))).toBe('chitsime_epa');
  });
});
