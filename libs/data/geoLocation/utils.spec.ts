import type { IGeolocationData } from './types';
import { getDeepestLocations } from './utils';

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
