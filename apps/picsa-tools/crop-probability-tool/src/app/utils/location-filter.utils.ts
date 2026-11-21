import { IGeolocationData } from '@picsa/data/geoLocation';

import { IProbabilityTableMeta } from '../models';

type ITableRef = Pick<IProbabilityTableMeta, 'id' | 'label' | 'locationId'>;

/** Resolve the canonical geo location id for a crop probability table entry */
export function getTableLocationId(table: Pick<IProbabilityTableMeta, 'id' | 'locationId'>): string {
  if (table.locationId) return table.locationId;
  const leaf = table.id.split('/').pop() ?? table.id;
  return leaf.split('--')[0];
}

/**
 * Filter geo location layers bottom-up to only include locations with crop probability tables.
 * Pure function — never mutates the shared per-country geo data.
 */
export function filterLocationsToProbabilityTables(data: IGeolocationData, tables: ITableRef[]): IGeolocationData {
  const { layers } = data;
  if (layers.length === 0) return data;

  const availableLeafIds = new Set(tables.map(getTableLocationId));
  const filteredLayers = layers.map((layer) => ({ ...layer, locations: [...layer.locations] }));

  // Filter leaf layer to locations with tables, then prune parent layers with no remaining children
  const lastIndex = filteredLayers.length - 1;
  filteredLayers[lastIndex].locations = filteredLayers[lastIndex].locations.filter((loc) =>
    availableLeafIds.has(loc.id),
  );

  for (let i = lastIndex - 1; i >= 0; i--) {
    const validParentIds = new Set(filteredLayers[i + 1].locations.map((c) => c.parentId).filter(Boolean));
    filteredLayers[i].locations = filteredLayers[i].locations.filter((loc) => validParentIds.has(loc.id));
  }

  return { ...data, layers: filteredLayers };
}
