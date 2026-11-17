// eslint-disable-next-line @nx/enforce-module-boundaries
import type { IStationCropData, IStationCropDataItem } from '@picsa/crop-probability/src/app/models';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { groupAndSortCropDataItems } from '@picsa/crop-probability/src/app/utils/probability-table.utils';

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

export interface ICombinedDiffTableResult {
  stationData: IStationCropData[];
  cellDiffs: Record<string, Partial<Record<string, string>>>;
}

function formatProb(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Math.round(value * 10)}/10`;
}

function formatWater(water?: number[]): string {
  return water && water.length > 0 ? `${water.join('-')} mm` : '—';
}

function splitVarieties(variety: string): string[] {
  return variety
    .split(/,\s*/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function findMatchingAppItem(
  dbItem: IStationCropDataItem,
  appItems: IStationCropDataItem[],
): IStationCropDataItem | undefined {
  const itemTokens = splitVarieties(dbItem.variety);
  return (
    appItems.find((a) => a.variety === dbItem.variety) ??
    appItems.find((a) => splitVarieties(a.variety).some((t) => itemTokens.includes(t)))
  );
}

/**
 * Percentage (0-100) of shared probability cells whose rounded X/10 values differ
 * between the committed app table and regenerated DB table. Returns null when
 * either table is absent or no shared cells exist to compare.
 */
export function calcProbabilityChangePct(
  app: IStationCropData[] | null | undefined,
  expected: IStationCropData[] | null | undefined,
): number | null {
  if (!app || !expected || app.length === 0 || expected.length === 0) return null;
  const appByCrop = new Map(app.map((entry) => [String(entry.crop), entry.data ?? []]));

  let totalCells = 0;
  let changedCells = 0;

  for (const cropEntry of expected) {
    const appItems = appByCrop.get(String(cropEntry.crop)) ?? [];
    for (const dbItem of cropEntry.data ?? []) {
      const matchedApp = findMatchingAppItem(dbItem, appItems);
      if (!matchedApp) continue;
      const dbProbs = dbItem.probabilities ?? [];
      const appProbs = matchedApp.probabilities ?? [];
      const len = Math.max(dbProbs.length, appProbs.length);
      for (let i = 0; i < len; i++) {
        totalCells++;
        if (formatProb(dbProbs[i]) !== formatProb(appProbs[i])) {
          changedCells++;
        }
      }
    }
  }

  if (totalCells === 0) return null;
  return Math.round((changedCells / totalCells) * 100);
}

/**
 * Build a combined IStationCropData[] for differing crops only (DB rows + removed App rows)
 * alongside cell-level diff tooltips (keyed by `${crop}/${variety}` -> column -> old value).
 */
export function buildCombinedDiffTable(params: {
  app: IStationCropData[] | null;
  expected: IStationCropData[] | null;
  appSeasonProbabilities?: (number | null)[];
  dbSeasonProbabilities?: (number | null)[];
}): ICombinedDiffTableResult {
  const { app, expected, appSeasonProbabilities, dbSeasonProbabilities } = params;
  const appList = app ?? [];
  const expectedList = expected ?? [];
  const cellDiffs: Record<string, Partial<Record<string, string>>> = {};

  if (appSeasonProbabilities && dbSeasonProbabilities) {
    const seasonDiffs: Partial<Record<string, string>> = {};
    const maxLen = Math.max(appSeasonProbabilities.length, dbSeasonProbabilities.length);
    for (let i = 0; i < maxLen; i++) {
      const appStr = formatProb(appSeasonProbabilities[i]);
      const dbStr = formatProb(dbSeasonProbabilities[i]);
      if (appStr !== dbStr) {
        seasonDiffs[`prob_${i}`] = `Was: ${appStr}`;
      }
    }
    if (Object.keys(seasonDiffs).length > 0) {
      cellDiffs['__season__'] = seasonDiffs;
    }
  }

  const appByCrop = new Map(appList.map((entry) => [String(entry.crop), entry.data ?? []]));
  const expectedByCrop = new Map(expectedList.map((entry) => [String(entry.crop), entry.data ?? []]));
  const stationData: IStationCropData[] = [];

  for (const crop of findDifferingCrops(appList, expectedList)) {
    const appItems = appByCrop.get(crop) ?? [];
    const dbItems = expectedByCrop.get(crop) ?? [];
    const dbTokens = new Set(dbItems.flatMap((it) => splitVarieties(it.variety)));

    for (const dbItem of dbItems) {
      const matchedApp = findMatchingAppItem(dbItem, appItems);
      const rowKey = `${crop}/${dbItem.variety}`;
      const rowDiff: Partial<Record<string, string>> = {};

      if (!matchedApp) {
        rowDiff['variety'] = 'Added in DB (not in App)';
        rowDiff['days'] = 'Added in DB';
        rowDiff['water'] = 'Added in DB';
        (dbItem.probabilities ?? []).forEach((_, idx) => {
          rowDiff[`prob_${idx}`] = 'Added in DB';
        });
      } else {
        if (dbItem.variety !== matchedApp.variety) {
          rowDiff['variety'] = `Was: ${matchedApp.variety}`;
        }
        if (dbItem.days !== matchedApp.days) {
          rowDiff['days'] = `Was: ${matchedApp.days}`;
        }
        if (formatWater(dbItem.water) !== formatWater(matchedApp.water)) {
          rowDiff['water'] = `Was: ${formatWater(matchedApp.water)}`;
        }
        const dbProbs = dbItem.probabilities ?? [];
        const appProbs = matchedApp.probabilities ?? [];
        const maxProbs = Math.max(dbProbs.length, appProbs.length);
        for (let i = 0; i < maxProbs; i++) {
          if (formatProb(dbProbs[i]) !== formatProb(appProbs[i])) {
            rowDiff[`prob_${i}`] = `Was: ${formatProb(appProbs[i])}`;
          }
        }
      }

      if (Object.keys(rowDiff).length > 0) {
        cellDiffs[rowKey] = rowDiff;
      }
    }

    // Include App items whose varieties were completely removed from DB
    const removedAppItems = appItems.filter((a) => !splitVarieties(a.variety).some((t) => dbTokens.has(t)));
    const removedPlaceholders: IStationCropDataItem[] = removedAppItems.map((a) => ({
      ...a,
      probabilities: (a.probabilities ?? []).map(() => null),
    }));
    const groupedRemoved = groupAndSortCropDataItems(removedPlaceholders);

    for (const removedRow of groupedRemoved) {
      const tokens = splitVarieties(removedRow.variety);
      const sources = removedAppItems.filter((a) => splitVarieties(a.variety).some((t) => tokens.includes(t)));
      const rowDiff: Partial<Record<string, string>> = {
        variety: `Removed from DB (was: ${removedRow.variety})`,
        days: `Removed (was: ${removedRow.days})`,
        water: `Removed (was: ${formatWater(removedRow.water)})`,
      };
      const maxProbs = Math.max(...sources.map((s) => (s.probabilities ?? []).length), 0);
      for (let i = 0; i < maxProbs; i++) {
        const oldVals = [...new Set(sources.map((s) => formatProb(s.probabilities?.[i])))];
        rowDiff[`prob_${i}`] = `Removed (was: ${oldVals.join(' / ')})`;
      }
      cellDiffs[`${crop}/${removedRow.variety}`] = rowDiff;
    }

    const combinedItems = [...dbItems, ...groupedRemoved];
    if (combinedItems.length > 0) {
      stationData.push({ crop: crop as IStationCropData['crop'], data: combinedItems });
    }
  }

  return { stationData, cellDiffs };
}
