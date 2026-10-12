import { groupRowsByRequirements, IPairingRow } from './station-pairing.utils';

export type LocationCoverageStatus = 'No Requirements' | 'Paired' | 'Unique';

export interface ICoverageGeoLocation {
  id: string;
  label: string;
  /** Parent tier label (e.g. province), empty when the tier has no parent */
  parent?: string;
}

export interface ICoverageRow {
  location_id: string;
  location_label: string;
  parent_location: string;
  status: LocationCoverageStatus;
  paired_with: string;
  station: string;
  crops: string;
}

const STATUS_ORDER: Record<LocationCoverageStatus, number> = {
  'No Requirements': 0,
  Paired: 1,
  Unique: 2,
};

function sortedJoin(values: Iterable<string>): string {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b)).join(', ');
}

function cropList(waterRequirements: IPairingRow['water_requirements']): string {
  return sortedJoin(Object.keys(waterRequirements ?? {}));
}

/**
 * Build one row per deployment district: districts without usable requirements
 * (no record, or a record still empty) share the No Requirements status, records
 * sharing byte-identical requirements are Paired, and the rest are Unique.
 * Data-system rows for unknown districts are appended as orphans.
 */
export function buildLocationCoverageRows(params: {
  geoLocations: ICoverageGeoLocation[];
  dbRows: IPairingRow[];
}): ICoverageRow[] {
  const { geoLocations, dbRows } = params;
  const dbById = new Map(dbRows.map((row) => [row.location_id, row]));
  const geoIds = new Set(geoLocations.map((location) => location.id));

  // Index multi-member groups by location for paired-with lookups
  const groupByLocation = new Map<string, IPairingRow[]>();
  for (const members of groupRowsByRequirements(dbRows).values()) {
    if (members.length <= 1) continue;
    for (const member of members) groupByLocation.set(member.location_id, members);
  }

  const rows: ICoverageRow[] = [];
  for (const location of geoLocations) {
    rows.push(buildGeoRow(location, dbById.get(location.id), groupByLocation));
  }

  // Data-system rows for districts outside deployment geo data
  for (const dbRow of dbRows) {
    if (geoIds.has(dbRow.location_id)) continue;
    rows.push(buildOrphanRow(dbRow, groupByLocation));
  }

  return rows.sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.location_label.localeCompare(b.location_label),
  );
}

/** Coverage row for a deployment district, merged with its data-system record if present */
function buildGeoRow(
  location: ICoverageGeoLocation,
  dbRow: IPairingRow | undefined,
  groupByLocation: Map<string, IPairingRow[]>,
): ICoverageRow {
  const base = {
    location_id: location.id,
    location_label: location.label,
    parent_location: location.parent ?? '',
  };
  if (!dbRow || Object.keys(dbRow.water_requirements ?? {}).length === 0) {
    return { ...base, status: 'No Requirements', paired_with: '', station: dbRow?.station_name ?? '', crops: '' };
  }
  const group = groupByLocation.get(location.id);
  if (!group) {
    return {
      ...base,
      status: 'Unique',
      paired_with: '',
      station: dbRow.station_name,
      crops: cropList(dbRow.water_requirements),
    };
  }
  const others = group.filter((member) => member.location_id !== location.id);
  return {
    ...base,
    status: 'Paired',
    paired_with: sortedJoin(others.map((member) => member.location_id)),
    station: dbRow.station_name,
    crops: cropList(dbRow.water_requirements),
  };
}

/** Coverage row for a data-system record outside deployment geo data */
function buildOrphanRow(dbRow: IPairingRow, groupByLocation: Map<string, IPairingRow[]>): ICoverageRow {
  const base = {
    location_id: dbRow.location_id,
    location_label: `${dbRow.location_id} (unknown district)`,
    parent_location: '',
    station: dbRow.station_name,
  };
  if (Object.keys(dbRow.water_requirements ?? {}).length === 0) {
    return { ...base, status: 'No Requirements', paired_with: '', crops: '' };
  }
  const group = groupByLocation.get(dbRow.location_id);
  if (!group) {
    return { ...base, status: 'Unique', paired_with: '', crops: cropList(dbRow.water_requirements) };
  }
  const others = group.filter((member) => member.location_id !== dbRow.location_id);
  return {
    ...base,
    status: 'Paired',
    paired_with: sortedJoin(others.map((member) => member.location_id)),
    crops: cropList(dbRow.water_requirements),
  };
}
