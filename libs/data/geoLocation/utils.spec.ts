import type { IGeolocationData } from './types';
import { getDeepestLocations, getLocationLabel, isLocationComplete } from './utils';

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
  it('should resolve parent ids and labels for tiered countries', () => {
    const data: IGeolocationData = {
      ...baseData,
      admin_5: {
        label: 'District',
        locations: [
          { id: 'chipata', label: 'Chipata', admin_4: 'eastern' },
          { id: 'kabwe', label: 'Kabwe', admin_4: 'central' },
        ],
      },
    };
    expect(getDeepestLocations(data)).toEqual([
      { id: 'chipata', label: 'Chipata', parentId: 'eastern', parentLabel: 'Eastern' },
      { id: 'kabwe', label: 'Kabwe', parentId: 'central', parentLabel: 'Central' },
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
