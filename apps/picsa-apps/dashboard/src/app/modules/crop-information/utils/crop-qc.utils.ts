import { MONTH_DATA } from '@picsa/data';

import type { IAnnualRainfallSummariesData, ICropSuccessEntry } from '../../climate/types';
import type { ICropData, ICropDataDownscaled, ICropDataDownscaledWaterRequirements } from '../services';

/** Default gate controlling whether varieties outside lookup bounds are excluded from generated tables */
export const ENFORCE_LOOKUP_BOUNDS = true;

/** Climate API crop success model is bounded within a single annual growing cycle (<= 360 days) */
export const MAX_SUPPORTED_CROP_DAYS = 360;

export type CropQcIssueCode =
  | 'missing_variety_definition'
  | 'days_below_lookup_min'
  | 'days_above_lookup_max'
  | 'days_upper_above_lookup_max'
  | 'water_below_lookup_min'
  | 'water_above_lookup_max'
  | 'exceeds_360_days'
  | 'exceeds_max_season_length';

export interface ICropQcIssue {
  code: CropQcIssueCode;
  severity: 'exclude' | 'warning';
  message: string;
}

export interface IStationLookupBounds {
  minDays: number;
  maxDays: number;
  daysSteps: number;
  daysStep: number | null;
  minWater: number;
  maxWater: number;
  waterSteps: number;
  waterStep: number | null;
  minPlantDay: number;
  maxPlantDay: number;
  plantDaySteps: number;
  plantDayStep: number | null;
  minPlantDateLabel: string;
  maxPlantDateLabel: string;
  entryCount: number;
}

export interface IStationSeasonBounds {
  minSeasonLength: number;
  maxSeasonLength: number;
  avgSeasonLength: number;
  validYears: number;
}

export interface ICropVarietyQcResult {
  locationId: string;
  stationId: string | null;
  crop: string;
  variety: string;
  daysLower: number | null;
  daysUpper: number | null;
  waterRequirement: number;
  included: boolean;
  failures: ICropQcIssue[];
  warnings: ICropQcIssue[];
}

export interface ILocationCropQcSummary {
  locationId: string;
  stationId: string | null;
  lookupBounds: IStationLookupBounds | null;
  seasonBounds: IStationSeasonBounds | null;
  evaluatedCount: number;
  includedCount: number;
  excludedCount: number;
  warningCount: number;
  results: ICropVarietyQcResult[];
}

export type CropVarietyQcStatus =
  | 'OK'
  | 'Partial Exclusion'
  | 'All Excluded'
  | 'Season / >360d Warning'
  | 'Missing Definition'
  | 'Unused';

export interface ICropVarietyLocationIssue {
  locationId: string;
  stationId: string | null;
  days: string;
  waterRequirement: number;
  excluded: boolean;
  reasons: string[];
}

export interface ICropVarietyQcAggregateRow {
  crop: string;
  variety: string;
  days: string;
  days_lower: number | null;
  days_upper: number | null;
  days_issue: 'exclude' | 'warning' | null;
  water_range: string;
  water_min: number | null;
  water_issue: 'exclude' | null;
  locations_total: number;
  locations_included: number;
  locations_excluded: number;
  warnings_count: number;
  status: CropVarietyQcStatus;
  status_rank: number;
  summary: string;
  issues: ICropVarietyLocationIssue[];
}

// HACK - current data system hardcodes 180-day offset from July 1 season start
export function formatPlantDayLabel(plantDate: number): string {
  const d = new Date(2025, 0);
  d.setDate(plantDate + 181);
  return `${d.getDate()}-${MONTH_DATA[d.getMonth()].labelShort}`;
}

function formatDaysRange(daysLower: number, daysUpper: number): string {
  return daysLower === daysUpper ? `${daysLower}` : `${daysLower}-${daysUpper}`;
}

function inferGridStep(values: Set<number>): number | null {
  if (values.size < 2) return null;
  const sorted = [...values].sort((a, b) => a - b);
  let minDiff = Infinity;
  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i] - sorted[i - 1];
    if (diff > 0 && diff < minDiff) minDiff = diff;
  }
  return Number.isFinite(minDiff) ? minDiff : null;
}

function buildLookupBoundsFromSets(params: {
  days: Set<number>;
  waters: Set<number>;
  plantDays: Set<number>;
  entryCount: number;
}): IStationLookupBounds | null {
  const { days, waters, plantDays, entryCount } = params;
  if (days.size === 0 || waters.size === 0 || plantDays.size === 0) return null;

  const minDays = Math.min(...days);
  const maxDays = Math.max(...days);
  const minWater = Math.min(...waters);
  const maxWater = Math.max(...waters);
  const minPlantDay = Math.min(...plantDays);
  const maxPlantDay = Math.max(...plantDays);

  return {
    minDays,
    maxDays,
    daysSteps: days.size,
    daysStep: inferGridStep(days),
    minWater,
    maxWater,
    waterSteps: waters.size,
    waterStep: inferGridStep(waters),
    minPlantDay,
    maxPlantDay,
    plantDaySteps: plantDays.size,
    plantDayStep: inferGridStep(plantDays),
    minPlantDateLabel: formatPlantDayLabel(minPlantDay),
    maxPlantDateLabel: formatPlantDayLabel(maxPlantDay),
    entryCount,
  };
}

function addFiniteNumber(target: Set<number>, value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    target.add(value);
  }
}

/** Extract empirical min/max lookup grid bounds from a station's crop_probability_data entries */
export function extractStationLookupBounds(
  entries: ICropSuccessEntry[] | null | undefined,
): IStationLookupBounds | null {
  if (!Array.isArray(entries) || entries.length === 0) return null;

  const days = new Set<number>();
  const waters = new Set<number>();
  const plantDays = new Set<number>();

  for (const entry of entries) {
    addFiniteNumber(days, entry.plant_length);
    addFiniteNumber(waters, entry.total_rain);
    addFiniteNumber(plantDays, entry.plant_day);
  }

  return buildLookupBoundsFromSets({ days, waters, plantDays, entryCount: entries.length });
}

/** Fallback bounds extraction directly from an already-built probability hashmap */
export function extractLookupBoundsFromHashmap(
  hashmap: Record<number, Record<number, Record<number, number>>> | null | undefined,
): IStationLookupBounds | null {
  if (!hashmap) return null;
  const waterKeys = Object.keys(hashmap).map(Number).filter(Number.isFinite);
  if (waterKeys.length === 0) return null;

  const waters = new Set(waterKeys);
  const days = new Set<number>();
  const plantDays = new Set<number>();
  let entryCount = 0;

  for (const wKey of waterKeys) {
    const byDays = hashmap[wKey] ?? {};
    for (const [dStr, byPlant] of Object.entries(byDays)) {
      const dNum = Number(dStr);
      if (!Number.isFinite(dNum)) continue;
      days.add(dNum);
      const plantKeys = Object.keys(byPlant ?? {})
        .map(Number)
        .filter(Number.isFinite);
      for (const pNum of plantKeys) {
        plantDays.add(pNum);
        entryCount++;
      }
    }
  }

  return buildLookupBoundsFromSets({ days, waters, plantDays, entryCount });
}

/** Extract observed historical season length bounds from a station's annual_rainfall_data */
export function extractStationSeasonBounds(
  rainfallData: IAnnualRainfallSummariesData[] | null | undefined,
): IStationSeasonBounds | null {
  if (!Array.isArray(rainfallData) || rainfallData.length === 0) return null;

  const lengths = rainfallData
    .map((row) => row?.season_length)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0);

  if (lengths.length === 0) return null;

  let min = lengths[0];
  let max = lengths[0];
  let sum = 0;
  for (const len of lengths) {
    if (len < min) min = len;
    if (len > max) max = len;
    sum += len;
  }

  return {
    minSeasonLength: min,
    maxSeasonLength: max,
    avgSeasonLength: Math.round((sum / lengths.length) * 10) / 10,
    validYears: lengths.length,
  };
}

/** Evaluate a single crop/variety against lookup bounds, season length, and Climate API cycle limits */
export function evaluateVarietyQc(params: {
  locationId?: string;
  stationId?: string | null;
  crop: string;
  variety: string;
  waterRequirement: number;
  varietyData?: Pick<ICropData['Row'], 'days_lower' | 'days_upper'>;
  lookupBounds: IStationLookupBounds | null;
  seasonBounds: IStationSeasonBounds | null;
  applyBounds?: boolean;
}): ICropVarietyQcResult {
  const {
    locationId = '',
    stationId = null,
    crop,
    variety,
    waterRequirement,
    varietyData,
    lookupBounds,
    seasonBounds,
    applyBounds = ENFORCE_LOOKUP_BOUNDS,
  } = params;

  const failures: ICropQcIssue[] = [];
  const warnings: ICropQcIssue[] = [];

  if (!varietyData) {
    failures.push({
      code: 'missing_variety_definition',
      severity: 'exclude',
      message: 'Missing variety definition in crop_data',
    });
    return {
      locationId,
      stationId,
      crop,
      variety,
      daysLower: null,
      daysUpper: null,
      waterRequirement,
      included: false,
      failures,
      warnings,
    };
  }

  const { days_lower: daysLower, days_upper: daysUpper } = varietyData;
  const daysStr = formatDaysRange(daysLower, daysUpper);

  if (daysUpper > MAX_SUPPORTED_CROP_DAYS) {
    warnings.push({
      code: 'exceeds_360_days',
      severity: 'warning',
      message: `${daysStr}d > ${MAX_SUPPORTED_CROP_DAYS}d API limit`,
    });
  }

  if (seasonBounds && daysUpper > seasonBounds.maxSeasonLength) {
    warnings.push({
      code: 'exceeds_max_season_length',
      severity: 'warning',
      message: `${daysStr}d > ${seasonBounds.maxSeasonLength}d max season`,
    });
  }

  if (lookupBounds) {
    if (daysLower < lookupBounds.minDays) {
      failures.push({
        code: 'days_below_lookup_min',
        severity: 'exclude',
        message: `${daysLower}d < ${lookupBounds.minDays}d lookup min`,
      });
    }
    if (daysLower > lookupBounds.maxDays) {
      failures.push({
        code: 'days_above_lookup_max',
        severity: 'exclude',
        message: `${daysStr}d > ${lookupBounds.maxDays}d lookup max`,
      });
    } else if (daysUpper > lookupBounds.maxDays) {
      failures.push({
        code: 'days_upper_above_lookup_max',
        severity: 'exclude',
        message: `${daysStr}d > ${lookupBounds.maxDays}d lookup max`,
      });
    }

    if (waterRequirement < lookupBounds.minWater) {
      failures.push({
        code: 'water_below_lookup_min',
        severity: 'exclude',
        message: `${waterRequirement}mm < ${lookupBounds.minWater}mm lookup min`,
      });
    } else if (waterRequirement > lookupBounds.maxWater) {
      failures.push({
        code: 'water_above_lookup_max',
        severity: 'exclude',
        message: `${waterRequirement}mm > ${lookupBounds.maxWater}mm lookup max`,
      });
    }
  }

  const included = !applyBounds || failures.length === 0;

  return {
    locationId,
    stationId,
    crop,
    variety,
    daysLower,
    daysUpper,
    waterRequirement,
    included,
    failures,
    warnings,
  };
}

/** Evaluate all downscaled crop water requirements for a single location against its station bounds */
export function evaluateLocationCropQc(params: {
  locationId?: string;
  stationId?: string | null;
  cropDataHashmap: Record<string, Pick<ICropData['Row'], 'days_lower' | 'days_upper'>>;
  waterRequirements: ICropDataDownscaledWaterRequirements;
  lookupBounds: IStationLookupBounds | null;
  seasonBounds: IStationSeasonBounds | null;
  applyBounds?: boolean;
}): ILocationCropQcSummary {
  const {
    locationId = '',
    stationId = null,
    cropDataHashmap,
    waterRequirements = {},
    lookupBounds,
    seasonBounds,
    applyBounds = ENFORCE_LOOKUP_BOUNDS,
  } = params;

  const results: ICropVarietyQcResult[] = [];
  let includedCount = 0;
  let excludedCount = 0;
  let warningCount = 0;

  for (const [crop, requirements] of Object.entries(waterRequirements)) {
    for (const [variety, waterRequirement] of Object.entries(requirements ?? {})) {
      const varietyData = cropDataHashmap[`${crop}/${variety}`];
      const result = evaluateVarietyQc({
        locationId,
        stationId,
        crop,
        variety,
        waterRequirement,
        varietyData,
        lookupBounds,
        seasonBounds,
        applyBounds,
      });
      results.push(result);
      if (result.included) includedCount++;
      else excludedCount++;
      if (result.warnings.length > 0) warningCount++;
    }
  }

  return {
    locationId,
    stationId,
    lookupBounds,
    seasonBounds,
    evaluatedCount: results.length,
    includedCount,
    excludedCount,
    warningCount,
    results,
  };
}

interface IStationBoundsEntry {
  lookupBounds: IStationLookupBounds | null;
  seasonBounds: IStationSeasonBounds | null;
}

interface IVarietyAggregator {
  crop: string;
  variety: string;
  daysLower: number | null;
  daysUpper: number | null;
  daysIssue: 'exclude' | 'warning' | null;
  waters: number[];
  waterIssue: 'exclude' | null;
  included: number;
  excluded: number;
  warnings: number;
  missingDef: boolean;
  issueTags: Set<string>;
  issues: ICropVarietyLocationIssue[];
}

const ISSUE_CODE_SHORT_LABEL: Record<CropQcIssueCode, string> = {
  missing_variety_definition: 'Missing crop_data',
  days_below_lookup_min: '< lookup min days',
  days_above_lookup_max: '> lookup max days',
  days_upper_above_lookup_max: '> lookup max days',
  water_below_lookup_min: '< lookup min mm',
  water_above_lookup_max: '> lookup max mm',
  exceeds_360_days: '> 360d limit',
  exceeds_max_season_length: '> max season',
};

const DAYS_EXCLUDE_CODES = new Set<CropQcIssueCode>([
  'days_below_lookup_min',
  'days_above_lookup_max',
  'days_upper_above_lookup_max',
]);

const WATER_EXCLUDE_CODES = new Set<CropQcIssueCode>(['water_below_lookup_min', 'water_above_lookup_max']);

function applyIssueFlags(agg: IVarietyAggregator, issue: ICropQcIssue) {
  agg.issueTags.add(ISSUE_CODE_SHORT_LABEL[issue.code]);
  if (DAYS_EXCLUDE_CODES.has(issue.code)) {
    agg.daysIssue = 'exclude';
  } else if (
    agg.daysIssue !== 'exclude' &&
    (issue.code === 'exceeds_360_days' || issue.code === 'exceeds_max_season_length')
  ) {
    agg.daysIssue = 'warning';
  }
  if (WATER_EXCLUDE_CODES.has(issue.code)) {
    agg.waterIssue = 'exclude';
  }
}

function mergeQcResultIntoAggregators(byKey: Map<string, IVarietyAggregator>, res: ICropVarietyQcResult) {
  const key = `${res.crop}/${res.variety}`;
  let agg = byKey.get(key);
  if (!agg) {
    agg = {
      crop: res.crop,
      variety: res.variety,
      daysLower: null,
      daysUpper: null,
      daysIssue: null,
      waters: [],
      waterIssue: null,
      included: 0,
      excluded: 0,
      warnings: 0,
      missingDef: true,
      issueTags: new Set(),
      issues: [],
    };
    byKey.set(key, agg);
  }
  agg.waters.push(res.waterRequirement);
  if (res.included) agg.included++;
  else agg.excluded++;
  if (res.warnings.length > 0) agg.warnings++;

  const allIssues = [...res.failures, ...res.warnings];
  if (allIssues.length === 0) return;

  for (const issue of allIssues) {
    applyIssueFlags(agg, issue);
  }
  agg.issues.push({
    locationId: res.locationId,
    stationId: res.stationId,
    days: res.daysLower != null && res.daysUpper != null ? formatDaysRange(res.daysLower, res.daysUpper) : '—',
    waterRequirement: res.waterRequirement,
    excluded: !res.included,
    reasons: allIssues.map((i) => i.message),
  });
}

/** Aggregate QC results per crop/variety across all deployment locations for the Admin Crops tab */
export function buildCropVarietyQcRows(params: {
  cropData: Pick<ICropData['Row'], 'crop' | 'variety' | 'days_lower' | 'days_upper'>[];
  downscaledData: Pick<ICropDataDownscaled['Row'], 'location_id' | 'station_id' | 'water_requirements'>[];
  stationBoundsById: Record<string, IStationBoundsEntry>;
  applyBounds?: boolean;
}): ICropVarietyQcAggregateRow[] {
  const { cropData, downscaledData, stationBoundsById, applyBounds = ENFORCE_LOOKUP_BOUNDS } = params;
  const cropDataHashmap: Record<string, Pick<ICropData['Row'], 'days_lower' | 'days_upper'>> = {};
  const byKey = new Map<string, IVarietyAggregator>();

  for (const c of cropData) {
    const key = `${c.crop}/${c.variety}`;
    cropDataHashmap[key] = c;
    const issueTags = new Set<string>();
    const exceeds360 = c.days_upper > MAX_SUPPORTED_CROP_DAYS;
    if (exceeds360) {
      issueTags.add(ISSUE_CODE_SHORT_LABEL.exceeds_360_days);
    }
    byKey.set(key, {
      crop: c.crop,
      variety: c.variety,
      daysLower: c.days_lower,
      daysUpper: c.days_upper,
      daysIssue: exceeds360 ? 'warning' : null,
      waters: [],
      waterIssue: null,
      included: 0,
      excluded: 0,
      warnings: 0,
      missingDef: false,
      issueTags,
      issues: [],
    });
  }

  for (const row of downscaledData) {
    const waterRequirements = (row.water_requirements as ICropDataDownscaledWaterRequirements) ?? {};
    const bounds = row.station_id ? stationBoundsById[row.station_id] : undefined;
    const summary = evaluateLocationCropQc({
      locationId: row.location_id,
      stationId: row.station_id,
      cropDataHashmap,
      waterRequirements,
      lookupBounds: bounds?.lookupBounds ?? null,
      seasonBounds: bounds?.seasonBounds ?? null,
      applyBounds,
    });
    for (const res of summary.results) {
      mergeQcResultIntoAggregators(byKey, res);
    }
  }

  const rows: ICropVarietyQcAggregateRow[] = [];
  for (const agg of byKey.values()) {
    const locationsTotal = agg.included + agg.excluded;
    const days = agg.daysLower != null && agg.daysUpper != null ? formatDaysRange(agg.daysLower, agg.daysUpper) : '—';
    const water_range = formatWaterRange(agg.waters);
    const water_min = agg.waters.length > 0 ? Math.min(...agg.waters) : null;
    const status = resolveAggregateStatus(agg, locationsTotal);
    const status_rank = STATUS_SORT_RANK[status];
    const warnings_count = agg.warnings || (agg.daysUpper != null && agg.daysUpper > MAX_SUPPORTED_CROP_DAYS ? 1 : 0);
    const summary = [...agg.issueTags].sort((a, b) => a.localeCompare(b)).join(', ');
    agg.issues.sort((a, b) => a.locationId.localeCompare(b.locationId));

    rows.push({
      crop: agg.crop,
      variety: agg.variety,
      days,
      days_lower: agg.daysLower,
      days_upper: agg.daysUpper,
      days_issue: agg.daysIssue,
      water_range,
      water_min,
      water_issue: agg.waterIssue,
      locations_total: locationsTotal,
      locations_included: agg.included,
      locations_excluded: agg.excluded,
      warnings_count,
      status,
      status_rank,
      summary,
      issues: agg.issues,
    });
  }

  return rows.sort((a, b) => a.crop.localeCompare(b.crop) || a.variety.localeCompare(b.variety));
}

function formatWaterRange(waters: number[]): string {
  if (waters.length === 0) return '—';
  let min = waters[0];
  let max = waters[0];
  for (const w of waters) {
    if (w < min) min = w;
    if (w > max) max = w;
  }
  return min === max ? `${min} mm` : `${min}-${max} mm`;
}

const STATUS_SORT_RANK: Record<CropVarietyQcStatus, number> = {
  'All Excluded': 1,
  'Partial Exclusion': 2,
  'Missing Definition': 3,
  'Season / >360d Warning': 4,
  OK: 5,
  Unused: 6,
};

function resolveAggregateStatus(agg: IVarietyAggregator, locationsTotal: number): CropVarietyQcStatus {
  if (agg.missingDef) return 'Missing Definition';
  if (agg.excluded > 0 && agg.included === 0) return 'All Excluded';
  if (agg.excluded > 0) return 'Partial Exclusion';
  if (agg.warnings > 0 || (agg.daysUpper != null && agg.daysUpper > MAX_SUPPORTED_CROP_DAYS)) {
    return 'Season / >360d Warning';
  }
  if (locationsTotal === 0) return 'Unused';
  return 'OK';
}
