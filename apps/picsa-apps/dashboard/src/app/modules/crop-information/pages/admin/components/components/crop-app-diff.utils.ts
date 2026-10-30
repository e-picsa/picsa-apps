// eslint-disable-next-line @nx/enforce-module-boundaries
import type { IStationCropData } from '@picsa/crop-probability/src/app/models';

/** App table ids are namespaced by parent region (e.g. `eastern/chipata`); db rows use the bare location id */
export function locationIdFromAppId(appId: string): string {
  const segments = appId.split('/');
  return segments[segments.length - 1];
}

export interface IProbabilityTableSummary {
  crops: number;
  varieties: number;
  cropNames: string[];
}

/** Count crops and individual variety entries within an app probability table */
export function summarizeProbabilityTable(table: IStationCropData[] | null | undefined): IProbabilityTableSummary {
  if (!table) return { crops: 0, varieties: 0, cropNames: [] };
  const cropNames = table.map((entry) => String(entry.crop));
  const varieties = table.reduce((sum, entry) => sum + (entry.data?.length ?? 0), 0);
  return { crops: table.length, varieties, cropNames };
}

/** Order-insensitive structural comparison for JSON-compatible values */
export function deepEqualJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((value, index) => deepEqualJson(value, b[index]));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const aEntries = Object.entries(a as Record<string, unknown>);
    const bRecord = b as Record<string, unknown>;
    if (aEntries.length !== Object.keys(bRecord).length) return false;
    return aEntries.every(([key, value]) => key in bRecord && deepEqualJson(value, bRecord[key]));
  }
  return false;
}

/** Names of crops whose entries differ between app and regenerated tables (including crops missing on either side) */
export function findDifferingCrops(app: IStationCropData[], expected: IStationCropData[]): string[] {
  const appByCrop = new Map(app.map((entry) => [String(entry.crop), entry]));
  const expectedByCrop = new Map(expected.map((entry) => [String(entry.crop), entry]));
  const cropNames = new Set([...appByCrop.keys(), ...expectedByCrop.keys()]);
  return [...cropNames]
    .filter((crop) => !deepEqualJson(appByCrop.get(crop) ?? null, expectedByCrop.get(crop) ?? null))
    .sort((a, b) => a.localeCompare(b));
}
