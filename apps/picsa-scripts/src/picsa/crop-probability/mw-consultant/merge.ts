/**
 * Merge + QC shared logic for the MW consultant EPA import.
 *
 * Pure functions over plain data (no Supabase, no xlsx) so the merge rules —
 * modal-days grouping, 20% conflict tiebreak, nearest-EPA station choice —
 * are unit-testable (see mw-consultant.spec.ts).
 */
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  computeExpectedProbabilityTable,
  // eslint-disable-next-line @nx/enforce-module-boundaries
} from '../../../../../../apps/picsa-apps/dashboard/src/app/modules/crop-information/utils/probability.utils';
import { roundToNearest } from '../extract-varieties/parser';
import type {
  ICleanedOccurrence,
  IDownscaledRow,
  IVarietyAcc,
  IVarietyDef,
  IWaterConflict,
  IWaterSample,
} from './block-types';
import { haversineKm, type IClimateStationRef } from './station-mapping';

/** Station resolution per block, as produced by resolveStationId. */
export type StationByBlock = Map<string, { station_id: string | null; method: string; detail: string }>;

export type WaterByLocation = Map<string, Map<string, Map<string, IWaterSample[]>>>;

/**
 * Spreadsheet fill-down detection: one water value copied across most of a
 * block's nonzero rows spanning several crops is a fabricated artifact, not
 * data (e.g. 24 of 31 Lifuwu rows at exactly 420 mm across 6 crops).
 * Returns blockKey::water keys to skip, with the row count as evidence.
 */
export function detectFillDown(
  blocks: { key: string; rows: { cropRaw: string | null; waterRaw: number | null }[] }[],
): Map<string, number> {
  const fill = new Map<string, number>();
  for (const block of blocks) {
    const nonzero = block.rows.filter(
      (r) => typeof r.waterRaw === 'number' && Number.isFinite(r.waterRaw) && (r.waterRaw as number) > 0,
    );
    if (nonzero.length < 5) continue;
    const counts = new Map<number, Set<string>>();
    for (const r of nonzero) {
      const w = r.waterRaw as number;
      if (!counts.has(w)) counts.set(w, new Set());
      counts.get(w)?.add((r.cropRaw ?? '').trim().toLowerCase());
    }
    for (const [w, crops] of counts) {
      const n = nonzero.filter((r) => r.waterRaw === w).length;
      if (n / nonzero.length > 0.4 && crops.size >= 3) {
        fill.set(`${block.key}::${w}`, n);
      }
    }
  }
  return fill;
}

export function accumulateOccurrences(
  occurrences: ICleanedOccurrence[],
  stationByBlock: StationByBlock,
): { varietyAcc: Map<string, IVarietyAcc>; waterByLocation: WaterByLocation } {
  const varietyAcc = new Map<string, IVarietyAcc>();
  const waterByLocation: WaterByLocation = new Map();
  for (const o of occurrences) {
    const key = `${o.crop}/${o.variety}`;
    let acc = varietyAcc.get(key);
    if (!acc) {
      acc = {
        crop: o.crop,
        variety: o.variety,
        waters: [],
        dayPairs: new Map(),
        maturities: new Map(),
        localNames: new Set(),
        blocks: new Set(),
      };
      varietyAcc.set(key, acc);
    }
    acc.waters.push(o.water);
    const dpKey = `${o.daysLower}-${o.daysUpper}`;
    const dp = acc.dayPairs.get(dpKey) ?? { lower: o.daysLower, upper: o.daysUpper, count: 0 };
    dp.count++;
    acc.dayPairs.set(dpKey, dp);
    if (o.maturity) acc.maturities.set(o.maturity, (acc.maturities.get(o.maturity) ?? 0) + 1);
    if (o.localName) acc.localNames.add(o.localName);
    acc.blocks.add(o.blockKey);
    let loc = waterByLocation.get(o.locationId);
    if (!loc) {
      loc = new Map();
      waterByLocation.set(o.locationId, loc);
    }
    let cropMap = loc.get(o.crop);
    if (!cropMap) {
      cropMap = new Map();
      loc.set(o.crop, cropMap);
    }
    const arr = cropMap.get(o.variety) ?? [];
    arr.push({
      water: o.water,
      blockKey: o.blockKey,
      stationId: stationByBlock.get(o.blockKey)?.station_id ?? null,
      daysLower: o.daysLower,
      daysUpper: o.daysUpper,
    });
    cropMap.set(o.variety, arr);
  }
  return { varietyAcc, waterByLocation };
}

/** Variety definitions use modal days_lower/upper across occurrences. */
export function buildVarietyDefs(
  varietyAcc: Map<string, IVarietyAcc>,
  countryCode: string,
): { varietyDefs: IVarietyDef[]; defDaysByVariety: Map<string, string> } {
  const varietyDefs = [...varietyAcc.values()].map((acc) => {
    const modal = [...acc.dayPairs.values()].sort((a, b) => b.count - a.count)[0];
    const maturity = [...acc.maturities.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]?.trim() || null;
    return {
      country_code: countryCode,
      crop: acc.crop,
      variety: acc.variety,
      maturity_period: maturity,
      days_lower: modal.lower,
      days_upper: modal.upper,
      additional_info: null as string | null,
      additional_data: {
        ...(acc.localNames.size > 0 ? { local_name: [...acc.localNames].join(', ') } : {}),
        source: 'mw-consultant-epa-import',
        blocks: [...acc.blocks],
      },
    };
  });
  const defDaysByVariety = new Map(
    varietyDefs.map((d) => [`${d.crop}/${d.variety}`, `${d.days_lower}-${d.days_upper}`]),
  );
  return { varietyDefs, defDaysByVariety };
}

function nearestEpaBlock(
  locationId: string,
  blockKeys: Iterable<string>,
  stationByBlock: StationByBlock,
  stationsById: Map<string, IClimateStationRef>,
  epaCoords: Map<string, { coordinates: { latitude: number; longitude: number } }>,
): string | null {
  const epa = epaCoords.get(locationId);
  if (!epa) return null;
  let best: string | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const blockKey of blockKeys) {
    const stationId = stationByBlock.get(blockKey)?.station_id;
    const st = (stationId && stationsById.get(stationId)) || null;
    if (!st || typeof st.latitude !== 'number' || typeof st.longitude !== 'number') continue;
    const d = haversineKm(epa.coordinates.latitude, epa.coordinates.longitude, st.latitude, st.longitude);
    if (d < bestDist) {
      bestDist = d;
      best = blockKey;
    }
  }
  return best;
}

/**
 * Per-location water requirements + per-location station.
 *
 * The same variety can appear in several rows (different maturity/day rows, or
 * duplicate EPA blocks). Group samples by days range first and keep the group
 * matching the variety definition's (global modal) days; within it use the
 * mean unless samples conflict by >20% (probable consultant typo), in which
 * case the value from the block nearest the EPA wins and the conflict is
 * logged for review (e.g. Dowa 135-day maize 378 vs 3715mm).
 *
 * The location's station_id comes from the same nearest-EPA block (not a
 * per-occurrence vote, which lets a secondary block outvote the primary EPA
 * block — e.g. Matenje outvoting Bilira for bilira_epa).
 */
export function mergeDownscaledWater(params: {
  waterByLocation: WaterByLocation;
  defDaysByVariety: Map<string, string>;
  epaCoords: Map<string, { coordinates: { latitude: number; longitude: number } }>;
  stationByBlock: StationByBlock;
  stations: IClimateStationRef[];
  countryCode: string;
}): { downscaled: IDownscaledRow[]; waterConflicts: IWaterConflict[] } {
  const { waterByLocation, defDaysByVariety, epaCoords, stationByBlock, stations, countryCode } = params;
  const stationsById = new Map(stations.map((s) => [s.id, s]));
  const meanRound = (xs: number[]): number => roundToNearest(xs.reduce((a, b) => a + b, 0) / xs.length, 5);
  const waterConflicts: IWaterConflict[] = [];
  const blockKeysByLocation = new Map<string, Set<string>>();
  for (const [locationId, crops] of waterByLocation) {
    const set = blockKeysByLocation.get(locationId) ?? new Set<string>();
    for (const vars of crops.values()) {
      for (const samples of vars.values()) {
        for (const s of samples) set.add(s.blockKey);
      }
    }
    blockKeysByLocation.set(locationId, set);
  }
  const downscaled = [...waterByLocation.entries()].map(([locationId, crops]) => {
    const water_requirements: Record<string, Record<string, number>> = {};
    for (const [crop, vars] of crops) {
      water_requirements[crop] = {};
      for (const [variety, samples] of vars) {
        // Prefer samples matching the variety definition's (global modal) days range
        // so stored water aligns with the defined maturity period.
        const defKey = defDaysByVariety.get(`${crop}/${variety}`);
        let group = samples;
        const matchingDef = defKey ? samples.filter((s) => `${s.daysLower}-${s.daysUpper}` === defKey) : [];
        if (matchingDef.length > 0) {
          if (matchingDef.length < samples.length) {
            waterConflicts.push({
              location_id: locationId,
              crop,
              variety,
              samples,
              chosen: -1,
              strategy: 'modal-days',
              dropped: samples
                .filter((s) => `${s.daysLower}-${s.daysUpper}` !== defKey)
                .map((s) => ({
                  water: s.water,
                  blockKey: s.blockKey,
                  daysLower: s.daysLower,
                  daysUpper: s.daysUpper,
                })),
            });
          }
          group = matchingDef;
        } else {
          // No sample matches the definition days: fall back to the modal group here
          const byDays = new Map<string, typeof samples>();
          for (const s of samples) {
            const k = `${s.daysLower}-${s.daysUpper}`;
            byDays.set(k, [...(byDays.get(k) ?? []), s]);
          }
          if (byDays.size > 1) {
            const modal = [...byDays.entries()].sort((a, b) => b[1].length - a[1].length)[0];
            group = modal[1];
            waterConflicts.push({
              location_id: locationId,
              crop,
              variety,
              samples,
              chosen: -1,
              strategy: 'modal-days',
              dropped: samples
                .filter((s) => `${s.daysLower}-${s.daysUpper}` !== modal[0])
                .map((s) => ({
                  water: s.water,
                  blockKey: s.blockKey,
                  daysLower: s.daysLower,
                  daysUpper: s.daysUpper,
                })),
            });
          }
        }
        if (group.length === 1) {
          water_requirements[crop][variety] = group[0].water;
          const conflict = waterConflicts.find(
            (c) => c.location_id === locationId && c.crop === crop && c.variety === variety && c.chosen === -1,
          );
          if (conflict) conflict.chosen = group[0].water;
          continue;
        }
        const waters = group.map((s) => s.water);
        const min = Math.min(...waters);
        const max = Math.max(...waters);
        if (min > 0 && (max - min) / min <= 0.2) {
          const mean = meanRound(waters);
          water_requirements[crop][variety] = mean;
          const conflict = waterConflicts.find(
            (c) => c.location_id === locationId && c.crop === crop && c.variety === variety && c.chosen === -1,
          );
          if (conflict) conflict.chosen = mean;
          continue;
        }
        // Extreme conflict: prefer the block whose station is nearest the EPA.
        // NOTE: ranks the modal-days `group`, never the unfiltered `samples`
        // (out-of-range day rows must not win over definition-matching rows).
        const ranked = group.map((s) => {
          const st = (s.stationId && stationsById.get(s.stationId)) || null;
          const epa = epaCoords.get(locationId);
          const d =
            epa && st && typeof st.latitude === 'number' && typeof st.longitude === 'number'
              ? Math.hypot(
                  epa.coordinates.latitude - (st.latitude as number),
                  epa.coordinates.longitude - (st.longitude as number),
                )
              : Number.POSITIVE_INFINITY;
          return { s, d };
        });
        ranked.sort((a, b) => a.d - b.d);
        const chosen = ranked[0].s.water;
        water_requirements[crop][variety] = chosen;
        // Resolve any pending modal-days entry with the final kept value so
        // both tables agree on what was stored.
        const pending = waterConflicts.find(
          (c) => c.location_id === locationId && c.crop === crop && c.variety === variety && c.chosen === -1,
        );
        if (pending) pending.chosen = chosen;
        waterConflicts.push({ location_id: locationId, crop, variety, samples, chosen, strategy: 'nearest-epa' });
      }
    }
    // Station from the block nearest the EPA (same proximity rule as water).
    const nearestBlock = nearestEpaBlock(
      locationId,
      blockKeysByLocation.get(locationId) ?? [],
      stationByBlock,
      stationsById,
      epaCoords,
    );
    const station_id = nearestBlock ? (stationByBlock.get(nearestBlock)?.station_id ?? null) : null;
    return { country_code: countryCode, location_id: locationId, water_requirements, station_id };
  });
  return { downscaled, waterConflicts };
}

export interface IQcSummary {
  location_id: string;
  station_id: string | null;
  status: string;
  reason?: string;
  included?: number;
  excluded?: number;
  exclusions?: { crop: string; variety: string; water: number; failures: unknown[] }[];
}

/** QC pre-check per location (ENFORCE_LOOKUP_BOUNDS; locationId/stationId attributed). */
export function runQcPrecheck(params: {
  downscaled: IDownscaledRow[];
  cropDataHashmap: Record<string, { days_lower: number; days_upper: number }>;
  stationDataById: Map<string, { annual_rainfall_data: unknown[]; crop_probability_data: unknown[] }>;
}): { qcSummaries: IQcSummary[]; included: number; excluded: number; skipped: number } {
  const { downscaled, cropDataHashmap, stationDataById } = params;
  const qcSummaries: IQcSummary[] = [];
  let included = 0;
  let excluded = 0;
  let skipped = 0;
  for (const row of downscaled) {
    const stationData = row.station_id ? stationDataById.get(row.station_id) : undefined;
    if (!stationData) {
      skipped++;
      qcSummaries.push({
        location_id: row.location_id,
        station_id: row.station_id,
        status: 'SKIPPED',
        reason: 'no station data',
      });
      continue;
    }
    const expected = computeExpectedProbabilityTable({
      cropDataHashmap: cropDataHashmap as never,
      waterRequirements: row.water_requirements as never,
      rainfallData: (stationData.annual_rainfall_data ?? []) as never,
      cropProbabilityData: (stationData.crop_probability_data ?? []) as never,
      locationId: row.location_id,
      stationId: row.station_id,
    });
    if (!expected) {
      skipped++;
      qcSummaries.push({
        location_id: row.location_id,
        station_id: row.station_id,
        status: 'SKIPPED',
        reason: 'insufficient station data',
      });
      continue;
    }
    const excludedRows = expected.qc.results.filter((r) => !r.included);
    included += expected.qc.includedCount;
    excluded += expected.qc.excludedCount;
    qcSummaries.push({
      location_id: row.location_id,
      station_id: row.station_id,
      status: excludedRows.length > 0 ? 'QC_EXCLUSIONS' : 'OK',
      included: expected.qc.includedCount,
      excluded: expected.qc.excludedCount,
      exclusions: excludedRows.map((r) => ({
        crop: r.crop,
        variety: r.variety,
        water: r.waterRequirement,
        failures: r.failures,
      })),
    });
  }
  return { qcSummaries, included, excluded, skipped };
}
