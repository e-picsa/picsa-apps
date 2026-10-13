import type { ClimateQcFailure, ClimateQcWarning, IStationData } from '@picsa/models';

/**
 * Baseline scientific Quality Gates for climate station records.
 * Standalone configuration for maintainability and audits.
 */
export interface IClimateQcGates {
  /** Minimum total years of historical rainfall observation data required */
  minTotalRainfallYears: number;
  /** Minimum number of rainfall observation years in the past 10 years */
  minRecentTenYears: number;
  /** Minimum number of rainfall observation years in the past 30 years */
  minRecentThirtyYears: number;
  /** Recency threshold window in years (e.g. 10 years) */
  recentTenYearsWindow: number;
  /** Historical baseline threshold window in years (e.g. 30 years) */
  recentThirtyYearsWindow: number;
}

export const CLIMATE_QC_GATES: IClimateQcGates = {
  minTotalRainfallYears: 30,
  minRecentTenYears: 1,
  minRecentThirtyYears: 10,
  recentTenYearsWindow: 10,
  recentThirtyYearsWindow: 30,
};

export const QC_FAILURE_LABELS: Record<ClimateQcFailure, string> = {
  insufficient_total_years: 'Insufficient total years (< 30 yrs)',
  no_recent_data: 'No recent data in past 10 years',
  sparse_recent_data: 'Sparse recent data (< 10 yrs in past 30)',
};

export const QC_WARNING_LABELS: Record<ClimateQcWarning, string> = {
  season_discrepancies: 'Season start/end discrepancies',
};

export interface ISeasonDiscrepancyRecord {
  year: number;
  hasStart: boolean;
  hasEnd: boolean;
}

export interface ISeasonDiscrepancyResult {
  count: number;
  discrepancies: ISeasonDiscrepancyRecord[];
}

export interface IStationQcEvaluation {
  passed: boolean;
  failures: ClimateQcFailure[];
  warnings: ClimateQcWarning[];
  reasons: string[];
  warningReasons: string[];
  seasonDiscrepancySummary: string;
  totalRainfallYears: number;
  recentTenYearsCount: number;
  recentThirtyYearsCount: number;
  seasonDiscrepanciesCount: number;
  seasonDiscrepancies: ISeasonDiscrepancyRecord[];
  rainfallStartYear?: number;
  rainfallEndYear?: number;
}

function isValidNumber(val: unknown): val is number {
  return typeof val === 'number' && !Number.isNaN(val);
}

/** Check if a row possesses a finite numeric rainfall observation */
export function hasValidRainfallObservation(row: IStationData | null | undefined): boolean {
  return isValidNumber(row?.Rainfall);
}

/** Check if a season boundary day-of-year value is valid */
export function hasValidSeasonBound(val: unknown): boolean {
  return isValidNumber(val) && val !== 0;
}

/**
 * Detect unpaired start of season vs end of season boundaries across station data.
 * Flagged when a season has a start date but no end date, or an end date without a start date.
 */
export function detectSeasonDiscrepancies(rows: IStationData[]): ISeasonDiscrepancyResult {
  const discrepancies: ISeasonDiscrepancyRecord[] = [];

  for (const row of rows) {
    if (!isValidNumber(row?.Year)) {
      continue;
    }
    const hasStart = hasValidSeasonBound(row.Start);
    const hasEnd = hasValidSeasonBound(row.End);

    if (hasStart !== hasEnd) {
      discrepancies.push({
        year: row.Year,
        hasStart,
        hasEnd,
      });
    }
  }

  return {
    count: discrepancies.length,
    discrepancies,
  };
}

/**
 * Format human-readable summary of season boundary discrepancies.
 * Examples:
 * - "2 years with start but no end, 1 year with end but no start"
 * - "1 year with start but no end"
 */
export function formatSeasonDiscrepancySummary(discrepancies: ISeasonDiscrepancyRecord[]): string {
  const startWithoutEnd = discrepancies.filter((d) => d.hasStart && !d.hasEnd).length;
  const endWithoutStart = discrepancies.filter((d) => !d.hasStart && d.hasEnd).length;

  const parts: string[] = [];
  if (startWithoutEnd > 0) {
    parts.push(`${startWithoutEnd} year${startWithoutEnd === 1 ? '' : 's'} with start but no end`);
  }
  if (endWithoutStart > 0) {
    parts.push(`${endWithoutStart} year${endWithoutStart === 1 ? '' : 's'} with end but no start`);
  }
  return parts.join(', ');
}

/**
 * Evaluate climate station data against standard quality control gates.
 *
 * Rules:
 * - Breaking Failures: Total rainfall years < 30, OR < 1 year in past 10, OR < 10 years in past 30.
 * - Non-Breaking Warnings: Season discrepancies (unpaired start/end of season bounds).
 * - Passed: 0 breaking failures (warnings do NOT cause failure).
 */
export function evaluateStationQualityGates(
  rows: IStationData[] | null | undefined,
  options?: {
    referenceYear?: number;
    gates?: IClimateQcGates;
  },
): IStationQcEvaluation {
  const data = rows ?? [];
  const gates = options?.gates ?? CLIMATE_QC_GATES;
  const referenceYear = options?.referenceYear ?? new Date().getFullYear();

  const rainfallRows = data.filter(hasValidRainfallObservation).sort((a, b) => a.Year - b.Year);

  const totalRainfallYears = rainfallRows.length;
  const recentTenYearsCount = rainfallRows.filter((r) => r.Year >= referenceYear - gates.recentTenYearsWindow).length;
  const recentThirtyYearsCount = rainfallRows.filter(
    (r) => r.Year >= referenceYear - gates.recentThirtyYearsWindow,
  ).length;

  const failures: ClimateQcFailure[] = [];
  const reasons: string[] = [];

  if (totalRainfallYears < gates.minTotalRainfallYears) {
    failures.push('insufficient_total_years');
    reasons.push(
      `Insufficient rainfall data: ${totalRainfallYears}/${gates.minTotalRainfallYears} minimum required years`,
    );
  }
  if (recentTenYearsCount < gates.minRecentTenYears) {
    failures.push('no_recent_data');
    reasons.push(
      `No recent data in past ${gates.recentTenYearsWindow} years (${recentTenYearsCount}/${gates.minRecentTenYears})`,
    );
  }
  if (recentThirtyYearsCount < gates.minRecentThirtyYears) {
    failures.push('sparse_recent_data');
    reasons.push(
      `Sparse recent data: ${recentThirtyYearsCount}/${gates.minRecentThirtyYears} years in past ${gates.recentThirtyYearsWindow} years`,
    );
  }

  const { count: seasonDiscrepanciesCount, discrepancies: seasonDiscrepancies } = detectSeasonDiscrepancies(data);

  const warnings: ClimateQcWarning[] = [];
  const warningReasons: string[] = [];
  const seasonDiscrepancySummary = formatSeasonDiscrepancySummary(seasonDiscrepancies);

  if (seasonDiscrepanciesCount > 0) {
    warnings.push('season_discrepancies');
    warningReasons.push(seasonDiscrepancySummary);
  }

  return {
    passed: failures.length === 0,
    failures,
    warnings,
    reasons,
    warningReasons,
    seasonDiscrepancySummary,
    totalRainfallYears,
    recentTenYearsCount,
    recentThirtyYearsCount,
    seasonDiscrepanciesCount,
    seasonDiscrepancies,
    rainfallStartYear: rainfallRows[0]?.Year,
    rainfallEndYear: rainfallRows[rainfallRows.length - 1]?.Year,
  };
}

/**
 * Determine effective draft status for a station based on quality control failure codes.
 * Stations that passed QC (empty failures array) are published (draft = false);
 * failing stations or unassessed stations (undefined) are marked draft (draft = true).
 */
export function resolveStationDraftStatus(qcFailures?: ClimateQcFailure[]): boolean {
  return !qcFailures || qcFailures.length > 0;
}
