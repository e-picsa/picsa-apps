import type { ICountryCode } from '../deployments';
import { getGeoLocationData } from './index';
import type { IGeolocationData } from './types';
import {
  getDeepestAdminLevel,
  getDeepestLocations,
  getLocationLabel,
  isLocationComplete,
  topoJsonToGeoJson,
} from './utils';

const baseData = {
  topoJson: async () => ({}) as never,
  admin_4: {
    label: 'Province',
    locations: [
      { id: 'eastern', label: 'Eastern' },
      { id: 'central', label: 'Central' },
    ],
  },
} as IGeolocationData;

describe('getDeepestLocations', () => {
  it('should resolve parent ids, labels, and topoName for tiered countries', () => {
    const data: IGeolocationData = {
      ...baseData,
      admin_5: {
        label: 'District',
        locations: [
          { id: 'chipata', label: 'Chipata', admin_4: 'eastern' },
          { id: 'senga', label: 'Senga', admin_4: 'central', topoName: 'Senga Hill District' },
        ],
      },
    };
    expect(getDeepestLocations(data)).toEqual([
      { id: 'chipata', label: 'Chipata', parentId: 'eastern', parentLabel: 'Eastern' },
      {
        id: 'senga',
        label: 'Senga',
        parentId: 'central',
        parentLabel: 'Central',
        topoName: 'Senga Hill District',
      },
    ]);
  });

  it('should return empty parents for single-tier countries', () => {
    expect(getDeepestLocations(baseData)).toEqual([
      { id: 'eastern', label: 'Eastern', parentId: '', parentLabel: '' },
      { id: 'central', label: 'Central', parentId: '', parentLabel: '' },
    ]);
  });

  it('should leave parent labels blank for unknown parent ids', () => {
    const data: IGeolocationData = {
      ...baseData,
      admin_5: { label: 'District', locations: [{ id: 'orphan', label: 'Orphan', admin_4: 'removed' }] },
    };
    expect(getDeepestLocations(data)).toEqual([
      { id: 'orphan', label: 'Orphan', parentId: 'removed', parentLabel: '' },
    ]);
  });
});

describe('isLocationComplete', () => {
  it('should require only admin_4 for single-tier countries', () => {
    expect(isLocationComplete(baseData, [undefined, undefined, 'mw'])).toBe(false);
    expect(isLocationComplete(baseData, [undefined, undefined, 'mw', undefined, 'lilongwe'])).toBe(true);
  });

  it('should require both segments for admin_4+admin_5 countries', () => {
    const data: IGeolocationData = {
      ...baseData,
      admin_5: { label: 'District', locations: [{ id: 'kabwe', label: 'Kabwe', admin_4: 'central' }] },
    };
    expect(isLocationComplete(data, [undefined, undefined, 'zm', undefined, 'central'])).toBe(false);
    expect(isLocationComplete(data, [undefined, undefined, 'zm', undefined, 'central', 'kabwe'])).toBe(true);
  });

  it('should require both segments for admin_4+admin_6 countries', () => {
    const data: IGeolocationData = {
      ...baseData,
      admin_6: { label: 'District', locations: [{ id: 'bikita', label: 'Bikita', admin_4: 'masvingo' }] },
    };
    expect(isLocationComplete(data, [undefined, undefined, 'zw', undefined, 'masvingo'])).toBe(false);
    expect(isLocationComplete(data, [undefined, undefined, 'zw', undefined, 'masvingo', 'bikita'])).toBe(true);
  });

  it('should return false without a location', () => {
    expect(isLocationComplete(baseData, undefined)).toBe(false);
  });
});

describe('getLocationLabel', () => {
  it('should resolve single-tier district labels', () => {
    const data: IGeolocationData = {
      ...baseData,
      admin_4: { label: 'District', locations: [{ id: 'lilongwe', label: 'Lilongwe' }] },
    };
    expect(getLocationLabel(data, [undefined, undefined, 'mw', undefined, 'lilongwe'])).toBe('Lilongwe');
    expect(getLocationLabel(data, [undefined, undefined, 'mw'])).toBeUndefined();
  });

  it('should prefer the deepest tier label, including admin_6 countries', () => {
    const data: IGeolocationData = {
      ...baseData,
      admin_4: { label: 'Province', locations: [{ id: 'masvingo', label: 'Masvingo' }] },
      admin_6: { label: 'District', locations: [{ id: 'bikita', label: 'Bikita', admin_4: 'masvingo' }] },
    };
    expect(getLocationLabel(data, [undefined, undefined, 'zw', undefined, 'masvingo', 'bikita'])).toBe('Bikita');
    expect(getLocationLabel(data, [undefined, undefined, 'zw', undefined, 'masvingo'])).toBe('Masvingo');
  });

  it('should fall back to admin_4 when the deep id is unknown', () => {
    const data: IGeolocationData = {
      ...baseData,
      admin_4: { label: 'Province', locations: [{ id: 'southern', label: 'Southern' }] },
      admin_5: { label: 'District', locations: [{ id: 'mazabuka', label: 'Mazabuka', admin_4: 'southern' }] },
    };
    const location = [undefined, undefined, 'zm', undefined, 'southern', 'southern/mazabuka--kafue-polder'];
    expect(getLocationLabel(data, location)).toBe('Southern');
  });
});

describe('TopoJSON boundary alignment for all countries', () => {
  const countries: ICountryCode[] = ['mw', 'zm', 'zw'];
  const normalize = (s?: string) =>
    (s ?? '')
      .toLowerCase()
      .replace(/\b(district|province|city|met)\b/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

  for (const country of countries) {
    it(`resolves every deepest location in "${country}" to a valid TopoJSON feature`, async () => {
      const data = getGeoLocationData(country);
      const deepest = getDeepestLocations(data);
      const adminLevel = getDeepestAdminLevel(data);
      const topo = await data.topoJson();
      const geojson = topoJsonToGeoJson(topo, adminLevel);

      expect(deepest.length).toBeGreaterThan(0);
      expect(geojson.features.length).toBeGreaterThan(0);

      for (const loc of deepest) {
        const candidates = [loc.label, loc.topoName, loc.id].filter((v): v is string => Boolean(v));
        const match = geojson.features.find((f) =>
          candidates.some((c) => normalize(f.properties?.name) === normalize(c)),
        );
        expect(match).toBeDefined();
      }
    });
  }
});
