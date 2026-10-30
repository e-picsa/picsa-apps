import { getLocationSlots, IGeolocationData } from '@picsa/data/geoLocation';

import { IProbabilityTableMeta } from '../models';

type ITableRef = Pick<IProbabilityTableMeta, 'id' | 'label'>;

/**
 * Filter geo location tiers to only include locations with crop probability tables.
 *
 * Pure function - always returns a new object and never mutates the input.
 * This matters as geo location data is shared per-country (see `getGeoLocationData`),
 * and the filter re-runs every time the location overlay is opened. A previous
 * implementation mutated the shared object in place, so reopening the overlay in
 * single-tier countries (e.g. mw) wiped the synthesised sublocation tier and left
 * the second dropdown with no options.
 */
export function filterLocationsToProbabilityTables(data: IGeolocationData, tables: ITableRef[]): IGeolocationData {
  const slots = getLocationSlots(data);
  // track table ids per level - ids use format parent[/child[--sublocation]]
  const availableByLevel: string[][] = slots.map(() => []);
  for (const entry of tables) {
    entry.id.split('/').forEach((segment, i) => {
      if (i < slots.length) availableByLevel[i].push(segment.split('--')[0]);
    });
  }

  // copy each tier, keeping only locations with probability tables available
  const filtered: IGeolocationData = { ...data };
  slots.forEach((slot, i) => {
    const tier = data[slot];
    if (!tier) return;
    const locations = tier.locations.filter((v) => availableByLevel[i].includes(v.id));
    filtered[slot] = { ...tier, locations } as never;
  });

  if (slots.length > 1) {
    const deepSlot = slots[slots.length - 1];
    const parentSlot = slots[slots.length - 2];
    // HACK - data can have multiple tables in same sublocation, e.g.
    // `southern/mazabuka--kafue-polder` and `southern/mazabuka--magoye-agromet`
    const sublocationEntries = tables
      .map((entry) => {
        const segments = entry.id.split('/');
        const [, sublocation] = (segments[1] || '').split('--');
        if (!sublocation) return undefined;
        return { id: entry.id, label: entry.label, [parentSlot]: segments[0] };
      })
      .filter((v) => v !== undefined);
    if (sublocationEntries.length > 0) {
      const deepTier = filtered[deepSlot];
      if (deepTier) {
        filtered[deepSlot] = { ...deepTier, locations: [...deepTier.locations, ...sublocationEntries] } as never;
      }
    }
  } else {
    // Single-tier geo data: only synthesise a sublocation tier when a district
    // has multiple tables (e.g. legacy `district/station` ids). With max one
    // table per district the district dropdown alone determines the table.
    const tablesByParent = new Map<string, ITableRef[]>();
    for (const entry of tables) {
      const [parent] = entry.id.split('/');
      const group = tablesByParent.get(parent) ?? [];
      group.push(entry);
      tablesByParent.set(parent, group);
    }
    const hasMultipleTables = [...tablesByParent.values()].some((group) => group.length > 1);
    if (!hasMultipleTables) return filtered;
    // HACK - single-tier geo data but crop probability tables include multiple per
    // location so create entries to use in filter
    const additionalLocations = tables.map(({ id, label }) => {
      const [parent, child] = id.split('/');
      return { id: child ?? parent, admin_4: parent, label };
    });
    filtered.admin_5 = { label: 'Location', locations: additionalLocations };
  }
  return filtered;
}
