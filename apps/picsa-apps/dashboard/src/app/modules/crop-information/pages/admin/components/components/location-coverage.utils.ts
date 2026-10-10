import { groupRowsByRequirements, IPairingRow } from './station-pairing.utils';

export type LocationCoverageStatus = 'Missing' | 'Empty' | 'Paired' | 'Unique';

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
  Missing: 0,
  Empty: 1,
  Paired: 2,
  Unique: 3,
};

function sortedJoin(values: Iterable<string>): string {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b)).join(', ');
}

function cropList(waterRequirements: IPairingRow['water_requirements']): string {
  return sortedJoin(Object.keys(waterRequirements ?? {}));
}

/**
 * Build one row per deployment district, merged with data-system records:
 * districts without a record are Missing, records without requirements are
 * Empty, records sharing byte-identical requirements are Paired, and the rest
 * are Unique. Data-system rows for unknown districts are appended as orphans.
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
    const dbRow = dbById.get(location.id);
    if (!dbRow) {
      rows.push({
        location_id: location.id,
        location_label: location.label,
        parent_location: location.parent ?? '',
        status: 'Missing',
        paired_with: '',
        station: '',
        crops: '',
      });
      continue;
    }
    if (Object.keys(dbRow.water_requirements ?? {}).length === 0) {
      rows.push({
        location_id: location.id,
        location_label: location.label,
        parent_location: location.parent ?? '',
        status: 'Empty',
        paired_with: '',
        station: dbRow.station_name,
        crops: '',
      });
      continue;
    }
    const group = groupByLocation.get(location.id);
    if (group) {
      const others = group.filter((member) => member.location_id !== location.id);
      rows.push({
        location_id: location.id,
        location_label: location.label,
        parent_location: location.parent ?? '',
        status: 'Paired',
        paired_with: sortedJoin(others.map((member) => member.location_id)),
        station: dbRow.station_name,
        crops: cropList(dbRow.water_requirements),
      });
    } else {
      rows.push({
        location_id: location.id,
        location_label: location.label,
        parent_location: location.parent ?? '',
        status: 'Unique',
        paired_with: '',
        station: dbRow.station_name,
        crops: cropList(dbRow.water_requirements),
      });
    }
  }

  // Data-system rows for districts outside deployment geo data
  for (const dbRow of dbRows) {
    if (geoIds.has(dbRow.location_id)) continue;
    const isEmpty = Object.keys(dbRow.water_requirements ?? {}).length === 0;
    const group = !isEmpty ? groupByLocation.get(dbRow.location_id) : undefined;
    rows.push({
      location_id: dbRow.location_id,
      location_label: `${dbRow.location_id} (unknown district)`,
      parent_location: '',
      status: isEmpty ? 'Empty' : group ? 'Paired' : 'Unique',
      paired_with: group
        ? sortedJoin(
            group.filter((member) => member.location_id !== dbRow.location_id).map((member) => member.location_id),
          )
        : '',
      station: dbRow.station_name,
      crops: isEmpty ? '' : cropList(dbRow.water_requirements),
    });
  }

  return rows.sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.location_label.localeCompare(b.location_label),
  );
}
