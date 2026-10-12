/** Deterministic serialization with recursively sorted object keys */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? '';
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort((a, b) => a.localeCompare(b));
  const entries = keys.map(
    (key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`,
  );
  return `{${entries.join(',')}}`;
}

export interface IPairingRow {
  location_id: string;
  station_name: string;
  water_requirements: Record<string, Record<string, number>>;
}

export interface IWaterRequirementGroup {
  members: number;
  locations: string;
  stations: string;
  crops: string;
}

/** Group rows by canonical requirements key, skipping rows with empty requirements */
export function groupRowsByRequirements(rows: IPairingRow[]): Map<string, IPairingRow[]> {
  const members = new Map<string, IPairingRow[]>();

  for (const row of rows) {
    if (Object.keys(row.water_requirements ?? {}).length === 0) continue;
    const key = stableStringify(row.water_requirements);
    const group = members.get(key);
    if (group) group.push(row);
    else members.set(key, [row]);
  }

  return members;
}

/**
 * Group rows sharing byte-identical water requirement definitions, returning
 * only groups with more than one member. Rows with empty requirements are skipped.
 */
export function groupIdenticalWaterRequirements(rows: IPairingRow[]): IWaterRequirementGroup[] {
  const members = groupRowsByRequirements(rows);

  const groups: IWaterRequirementGroup[] = [];
  for (const groupRows of members.values()) {
    if (groupRows.length <= 1) continue;
    const locations = [...new Set(groupRows.map((row) => row.location_id))].sort((a, b) => a.localeCompare(b));
    const stations = [...new Set(groupRows.map((row) => row.station_name))].sort((a, b) => a.localeCompare(b));
    const crops = [...new Set(groupRows.flatMap((row) => Object.keys(row.water_requirements)))].sort((a, b) =>
      a.localeCompare(b),
    );
    groups.push({
      members: groupRows.length,
      locations: locations.join(', '),
      stations: stations.join(', '),
      crops: crops.join(', '),
    });
  }

  return groups.sort((a, b) => b.members - a.members || a.locations.localeCompare(b.locations));
}
