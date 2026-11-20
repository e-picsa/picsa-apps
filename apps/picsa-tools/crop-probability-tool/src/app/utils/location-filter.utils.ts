import { IGeolocationData } from '@picsa/data/geoLocation';

import { IProbabilityTableMeta } from '../models';

type ITableRef = Pick<IProbabilityTableMeta, 'id' | 'label'>;

/**
 * Filter geo location layers to only include locations with crop probability tables.
 *
 * Pure function - always returns a new object and never mutates the input.
 * This matters as geo location data is shared per-country (see `getGeoLocationData`),
 * and the filter re-runs every time the location overlay is opened. A previous
 * implementation mutated the shared object in place, so reopening the overlay in
 * single-layer countries (e.g. mw) wiped the synthesised sublocation layer and left
 * the second dropdown with no options.
 */
export function filterLocationsToProbabilityTables(data: IGeolocationData, tables: ITableRef[]): IGeolocationData {
  const { layers } = data;
  // track table ids per level - ids use format parent[/child[--sublocation]]
  const availableByLevel: string[][] = layers.map(() => []);
  for (const entry of tables) {
    entry.id.split('/').forEach((segment, i) => {
      if (i < layers.length) availableByLevel[i].push(segment.split('--')[0]);
    });
  }

  // copy each layer, keeping only locations with probability tables available
  const filteredLayers = layers.map((layer, i) => ({
    ...layer,
    locations: layer.locations.filter((v) => availableByLevel[i].includes(v.id)),
  }));

  if (filteredLayers.length > 1) {
    const deepIndex = filteredLayers.length - 1;
    // HACK - data can have multiple tables in same sublocation, e.g.
    // `southern/mazabuka--kafue-polder` and `southern/mazabuka--magoye-agromet`
    const sublocationEntries = tables
      .map((entry) => {
        const segments = entry.id.split('/');
        const [, sublocation] = (segments[1] || '').split('--');
        if (!sublocation) return undefined;
        return { id: entry.id, label: entry.label, parentId: segments[0] };
      })
      .filter((v) => v !== undefined);
    if (sublocationEntries.length > 0) {
      const deepLayer = filteredLayers[deepIndex];
      filteredLayers[deepIndex] = {
        ...deepLayer,
        locations: [...deepLayer.locations, ...sublocationEntries],
      };
    }
  } else {
    // Single-layer geo data: only synthesise a sublocation layer when a district
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
    if (hasMultipleTables) {
      // HACK - single-layer geo data but crop probability tables include multiple per
      // location so create entries to use in filter
      const additionalLocations = tables.map(({ id, label }) => {
        const [parent, child] = id.split('/');
        return { id: child ?? parent, parentId: parent, label };
      });
      filteredLayers.push({ key: 'location', label: 'Location', locations: additionalLocations });
    }
  }

  return { ...data, layers: filteredLayers };
}
