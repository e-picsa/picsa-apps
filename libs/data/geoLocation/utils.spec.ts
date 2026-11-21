import type { ICountryCode } from '../deployments';
import * as dataModule from './data';
import { getGeoLocationData } from './data';
import MW_EPAS from './mw/epas';
import type { GeoToolKey, IGeolocationData } from './types';
import {
  clearGeoJsonFeatureCache,
  findLocationForTool,
  getLocationsForTool,
  getLocationTopoFeature,
  getSelectionLabel,
  getToolLayers,
  isSelectionComplete,
  resolveLocationForTool,
} from './utils';

describe('manifest integrity across configured countries', () => {
  const countries: ICountryCode[] = ['mw', 'zm', 'zw'];
  const tools: GeoToolKey[] = ['cropProbability', 'forecast', 'climate'];

  for (const country of countries) {
    it(`has valid layer links, unique ids per layer, and valid toolLayers for "${country}"`, () => {
      const data = getGeoLocationData(country);
      expect(data.layers.length).toBeGreaterThan(0);

      for (let i = 0; i < data.layers.length; i++) {
        const layer = data.layers[i];
        const ids = new Set(layer.locations.map((l) => l.id));
        expect(ids.size).toBe(layer.locations.length);

        if (i > 0) {
          const parentKey = layer.parentLayer ?? data.layers[i - 1].key;
          const parentIds = new Set(data.layers.find((l) => l.key === parentKey)?.locations.map((l) => l.id) ?? []);
          for (const loc of layer.locations) {
            expect(parentIds.has(loc.parentId ?? '')).toBe(true);
          }
        }
      }

      for (const tool of tools) {
        expect(getLocationsForTool(country, tool).length).toBeGreaterThan(0);
      }
    });
  }

  it('validates mw/epas.ts references existing mw districts with unique ids', () => {
    const mwDistrictIds = new Set(getLocationsForTool('mw', 'forecast').map((d) => d.id));
    const epaIds = new Set(MW_EPAS.map((e) => e.id));
    expect(epaIds.size).toBe(MW_EPAS.length);
    for (const epa of MW_EPAS) {
      expect(mwDistrictIds.has(epa.district)).toBe(true);
      expect(epa.coordinates).toBeDefined();
    }
  });
});

describe('getLocationsForTool & findLocationForTool', () => {
  it('resolves parent metadata and topoName for zm, zw, and mw', () => {
    expect(findLocationForTool('zm', 'cropProbability', 'chipata')).toEqual({
      id: 'chipata',
      label: 'Chipata',
      layerKey: 'district',
      parentId: 'eastern',
      parentLabel: 'Eastern',
    });
    expect(findLocationForTool('zw', 'cropProbability', 'mangwe')).toEqual({
      id: 'mangwe',
      label: 'Mangwe',
      layerKey: 'district',
      parentId: 'matabeleland_south',
      parentLabel: 'Matabeleland South',
      topoName: 'Bulilimamangwe',
    });
    expect(findLocationForTool('mw', 'forecast', 'nneno')).toEqual({
      id: 'nneno',
      label: 'Nneno',
      layerKey: 'district',
      parentId: '',
      parentLabel: '',
      topoName: 'Neno',
    });
    expect(findLocationForTool('zw', 'cropProbability', 'unknown_id')).toBeUndefined();
  });
});

describe('resolveLocationForTool', () => {
  it('resolves exact, coarser, single-child, mismatched, and empty selections across ZM/ZW/MW', () => {
    // Exact match + ZW cross-layer id collision
    expect(resolveLocationForTool('zw', { province: 'masvingo', district: 'masvingo' }, 'cropProbability')).toEqual({
      layerKey: 'district',
      locations: [
        { id: 'masvingo', label: 'Masvingo', layerKey: 'district', parentId: 'masvingo', parentLabel: 'Masvingo' },
      ],
    });

    // Coarser selection -> multiple matching children
    const provinceOnly = resolveLocationForTool('zw', { province: 'masvingo' }, 'cropProbability');
    expect(provinceOnly.locations.length).toBeGreaterThan(1);
    expect(provinceOnly.locations.every((l) => l.parentId === 'masvingo')).toBe(true);

    // Single-child province auto-resolves to 1 location
    expect(
      resolveLocationForTool('zw', { province: 'harare_province' }, 'forecast').locations.map((l) => l.id),
    ).toEqual(['harare']);

    // Parent-mismatched child is rejected
    const mismatched = resolveLocationForTool('zw', { province: 'masvingo', district: 'buhera' }, 'forecast');
    expect(mismatched.locations.some((l) => l.id === 'buhera')).toBe(false);

    // Empty / unknown
    expect(resolveLocationForTool('mw', undefined, 'forecast').locations).toEqual([]);
    expect(resolveLocationForTool('mw', { district: 'nonexistent' }, 'forecast').locations).toEqual([]);
  });

  it('resolves MW 2-layer EPA selection to EPA for crop/climate and walks up to district for forecast', async () => {
    clearGeoJsonFeatureCache();
    const mwData = getGeoLocationData('mw');
    const mwWithEpas: IGeolocationData = {
      topoJson: mwData.topoJson,
      layers: [
        mwData.layers[0],
        {
          key: 'epa',
          label: 'EPA',
          parentLayer: 'district',
          locations: MW_EPAS.map((e) => ({
            id: e.id,
            label: e.label,
            parentId: e.district,
            coordinates: e.coordinates,
          })),
        },
      ],
      toolLayers: { forecast: 'district' },
    };
    const spy = jest.spyOn(dataModule, 'getGeoLocationData').mockReturnValue(mwWithEpas);
    try {
      expect(getToolLayers('mw', 'forecast').map((l) => l.key)).toEqual(['district']);
      expect(getToolLayers('mw', 'cropProbability').map((l) => l.key)).toEqual(['district', 'epa']);

      const sel = { district: 'mzimba', epa: 'eswazini_epa__mzimba' };
      expect(resolveLocationForTool('mw', sel, 'cropProbability').locations[0].id).toBe('eswazini_epa__mzimba');
      expect(resolveLocationForTool('mw', sel, 'forecast').locations.map((l) => l.id)).toEqual(['mzimba']);
      expect(resolveLocationForTool('mw', { district: 'balaka' }, 'cropProbability').locations).toHaveLength(6);

      const feature = await getLocationTopoFeature('mw', 'eswazini_epa__mzimba', 'epa');
      expect(feature?.properties?.name).toContain('Mzimba');
    } finally {
      spy.mockRestore();
      clearGeoJsonFeatureCache();
    }
  });

  it('supports 3+ layers dynamically for future countries', () => {
    const threeLayerData: IGeolocationData = {
      topoJson: async () => ({}) as never,
      layers: [
        { key: 'region', label: 'Region', locations: [{ id: 'north', label: 'North' }] },
        {
          key: 'province',
          label: 'Province',
          parentLayer: 'region',
          locations: [{ id: 'prov_a', label: 'Province A', parentId: 'north' }],
        },
        {
          key: 'ward',
          label: 'Ward',
          parentLayer: 'province',
          locations: [
            { id: 'ward_1', label: 'Ward 1', parentId: 'prov_a' },
            { id: 'ward_2', label: 'Ward 2', parentId: 'prov_a' },
          ],
        },
      ],
      toolLayers: { forecast: 'province' },
    };
    const spy = jest.spyOn(dataModule, 'getGeoLocationData').mockReturnValue(threeLayerData);
    try {
      const sel = { region: 'north', province: 'prov_a', ward: 'ward_2' };
      expect(isSelectionComplete('zm', sel)).toBe(true);
      expect(getSelectionLabel('zm', sel)).toBe('Ward 2');
      expect(resolveLocationForTool('zm', sel, 'forecast').locations.map((l) => l.id)).toEqual(['prov_a']);
      expect(resolveLocationForTool('zm', { region: 'north' }, 'cropProbability').locations.map((l) => l.id)).toEqual([
        'ward_1',
        'ward_2',
      ]);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('isSelectionComplete & getSelectionLabel', () => {
  it('checks completeness and resolves deepest label', () => {
    expect(isSelectionComplete('mw', { district: 'lilongwe' })).toBe(true);
    expect(isSelectionComplete('mw', {})).toBe(false);
    expect(isSelectionComplete('zw', { province: 'masvingo' })).toBe(false);
    expect(isSelectionComplete('zw', { province: 'masvingo', district: 'bikita' })).toBe(true);

    expect(getSelectionLabel('zw', { province: 'masvingo', district: 'bikita' })).toBe('Bikita');
    expect(getSelectionLabel('zw', { province: 'masvingo' })).toBe('Masvingo');
    expect(getSelectionLabel('mw', undefined)).toBeUndefined();
  });
});

describe('getLocationTopoFeature', () => {
  for (const country of ['mw', 'zm', 'zw'] as ICountryCode[]) {
    it(`resolves every deepest location in "${country}" to a valid TopoJSON feature`, async () => {
      for (const loc of getLocationsForTool(country, 'forecast')) {
        expect(await getLocationTopoFeature(country, loc.id)).toBeDefined();
      }
    });
  }

  it('distinguishes parent vs downscaled role when ids collide across layers', async () => {
    const provinceFeature = await getLocationTopoFeature('zw', 'masvingo', 'parent');
    const districtFeature = await getLocationTopoFeature('zw', 'masvingo', 'downscaled');
    expect(String(provinceFeature?.properties?.admin_level)).toBe('4');
    expect(String(districtFeature?.properties?.admin_level)).toBe('6');
  });
});
