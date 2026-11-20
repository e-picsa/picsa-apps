import type { ICountryCode } from '../deployments';
import * as dataModule from './data';
import { getGeoLocationData } from './data';
import type { IGeolocationData } from './types';
import {
  clearGeoJsonFeatureCache,
  getDownscaledLocation,
  getDownscaledLocations,
  getLocationLabel,
  getLocationTopoFeature,
  isLocationComplete,
} from './utils';

describe('getDownscaledLocations', () => {
  it('resolves parent ids, labels, and topoName for multi-layer countries (zm, zw)', () => {
    const zmLocations = getDownscaledLocations('zm');
    expect(zmLocations.find((l) => l.id === 'chipata')).toEqual({
      id: 'chipata',
      label: 'Chipata',
      parentId: 'eastern',
      parentLabel: 'Eastern',
    });
    expect(zmLocations.find((l) => l.id === 'senga')).toEqual({
      id: 'senga',
      label: 'Senga',
      parentId: 'northern',
      parentLabel: 'Northern',
      topoName: 'Senga Hill District',
    });

    const zwLocations = getDownscaledLocations('zw');
    expect(zwLocations.find((l) => l.id === 'bikita')).toEqual({
      id: 'bikita',
      label: 'Bikita',
      parentId: 'masvingo',
      parentLabel: 'Masvingo',
    });
    expect(zwLocations.find((l) => l.id === 'mangwe')).toEqual({
      id: 'mangwe',
      label: 'Mangwe',
      parentId: 'matabeleland_south',
      parentLabel: 'Matabeleland South',
      topoName: 'Bulilimamangwe',
    });
  });

  it('returns empty parent metadata for single-layer countries (mw)', () => {
    const mwLocations = getDownscaledLocations('mw');
    expect(mwLocations.find((l) => l.id === 'lilongwe')).toEqual({
      id: 'lilongwe',
      label: 'Lilongwe',
      parentId: '',
      parentLabel: '',
    });
    expect(mwLocations.find((l) => l.id === 'nneno')).toEqual({
      id: 'nneno',
      label: 'Nneno',
      parentId: '',
      parentLabel: '',
      topoName: 'Neno',
    });
  });
});

describe('getDownscaledLocation', () => {
  it('looks up downscaled locations strictly in the deepest layer, handling cross-layer id collisions', () => {
    expect(getDownscaledLocation('zw', 'masvingo')).toEqual({
      id: 'masvingo',
      label: 'Masvingo',
      parentId: 'masvingo',
      parentLabel: 'Masvingo',
    });
    expect(getDownscaledLocation('mw', 'nkhata_bay')).toEqual({
      id: 'nkhata_bay',
      label: 'Nkhata Bay',
      parentId: '',
      parentLabel: '',
    });
  });

  it('falls back to a formatted label with empty parents when location_id is unknown', () => {
    expect(getDownscaledLocation('zw', 'custom_station_area')).toEqual({
      id: 'custom_station_area',
      label: 'Custom Station Area',
      parentId: '',
      parentLabel: '',
    });
  });
});

describe('isLocationComplete', () => {
  it('requires only segment 4 for single-layer countries (mw)', () => {
    expect(isLocationComplete('mw', [undefined, undefined, 'mw'])).toBe(false);
    expect(isLocationComplete('mw', [undefined, undefined, 'mw', undefined, 'lilongwe'])).toBe(true);
  });

  it('requires both segments 4 and 5 for multi-layer countries (zm, zw)', () => {
    expect(isLocationComplete('zm', [undefined, undefined, 'zm', undefined, 'central'])).toBe(false);
    expect(isLocationComplete('zm', [undefined, undefined, 'zm', undefined, 'central', 'kabwe'])).toBe(true);

    expect(isLocationComplete('zw', [undefined, undefined, 'zw', undefined, 'masvingo'])).toBe(false);
    expect(isLocationComplete('zw', [undefined, undefined, 'zw', undefined, 'masvingo', 'bikita'])).toBe(true);
  });

  it('returns false without a location', () => {
    expect(isLocationComplete('mw', undefined)).toBe(false);
  });
});

describe('getLocationLabel', () => {
  it('resolves single-layer district labels (mw)', () => {
    expect(getLocationLabel('mw', [undefined, undefined, 'mw', undefined, 'lilongwe'])).toBe('Lilongwe');
    expect(getLocationLabel('mw', [undefined, undefined, 'mw'])).toBeUndefined();
  });

  it('prefers the deepest layer label for multi-layer countries (zw)', () => {
    expect(getLocationLabel('zw', [undefined, undefined, 'zw', undefined, 'masvingo', 'bikita'])).toBe('Bikita');
    expect(getLocationLabel('zw', [undefined, undefined, 'zw', undefined, 'masvingo'])).toBe('Masvingo');
  });

  it('falls back to top layer when the deep id is unknown', () => {
    const location = [undefined, undefined, 'zm', undefined, 'southern', 'southern/mazabuka--kafue-polder'];
    expect(getLocationLabel('zm', location)).toBe('Southern');
  });
});

describe('getLocationTopoFeature', () => {
  const countries: ICountryCode[] = ['mw', 'zm', 'zw'];

  for (const country of countries) {
    it(`resolves every deepest location in "${country}" to a valid TopoJSON feature`, async () => {
      const deepest = getDownscaledLocations(country);
      expect(deepest.length).toBeGreaterThan(0);

      for (const loc of deepest) {
        const feature = await getLocationTopoFeature(country, loc.id);
        expect(feature).toBeDefined();
      }
    });
  }

  it('distinguishes parent vs downscaled role when ids collide across layers', async () => {
    const provinceFeature = await getLocationTopoFeature('zw', 'masvingo', 'parent');
    const districtFeature = await getLocationTopoFeature('zw', 'masvingo', 'downscaled');

    expect(provinceFeature).toBeDefined();
    expect(districtFeature).toBeDefined();
    expect(String(provinceFeature?.properties?.admin_level)).toBe('4');
    expect(String(districtFeature?.properties?.admin_level)).toBe('6');
  });

  it('falls back to parent layer topoAdminLevel when deepest layer has no boundary geometries', async () => {
    clearGeoJsonFeatureCache();
    const mwData = getGeoLocationData('mw');
    const mockData: IGeolocationData = {
      topoJson: mwData.topoJson,
      layers: [
        mwData.layers[0],
        {
          key: 'epa',
          label: 'EPA',
          locations: [{ id: 'lilongwe_west', label: 'Lilongwe West', parentId: 'lilongwe' }],
        },
      ],
    };
    const spy = jest.spyOn(dataModule, 'getGeoLocationData').mockReturnValue(mockData);
    try {
      const feature = await getLocationTopoFeature('mw', 'lilongwe_west');
      expect(feature).toBeDefined();
      expect(feature?.properties?.name).toContain('Lilongwe');
    } finally {
      spy.mockRestore();
      clearGeoJsonFeatureCache();
    }
  });
});
