import type { IForecastRow } from '../../../types';

/** Hours without any sync before the current month is flagged as stale */
export const FORECAST_STALE_AFTER_HOURS = 48;

export interface IForecastMonthSummary {
  /** YYYYMM id prefix */
  prefix: string;
  /** Display label, e.g. 'Nov 2026' */
  label: string;
  dailyLive: number;
  dailyPending: number;
  weeklyLive: number;
  weeklyPending: number;
  /** Most recent row update in the month, null when empty */
  lastSync: string | null;
  /** Current month only: true when nothing synced within the stale window */
  stale: boolean;
}

export interface IForecastOverview {
  current: IForecastMonthSummary;
  previous: IForecastMonthSummary;
  /** Label of the latest live seasonal forecast, null when none */
  seasonalLatest: string | null;
  /** Distinct downscaled locations with a live file */
  downscaledLocations: number;
  /** Most recent row update across all rows, null when empty */
  lastSync: string | null;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthMeta(refDate: Date, offsetMonths: number): { prefix: string; label: string } {
  const d = new Date(Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth() + offsetMonths, 1));
  const prefix = d.toISOString().slice(0, 7).replace('-', '');
  return { prefix, label: `${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCFullYear()}` };
}

const isLive = (row: Pick<IForecastRow, 'storage_file'>) => !!row.storage_file;

function maxUpdated(rows: Pick<IForecastRow, 'updated_at'>[]): string | null {
  let latest: string | null = null;
  for (const row of rows) {
    if (row.updated_at && (!latest || row.updated_at > latest)) {
      latest = row.updated_at;
    }
  }
  return latest;
}

function summariseMonth(
  rows: IForecastRow[],
  meta: { prefix: string; label: string },
  stale: boolean,
): IForecastMonthSummary {
  const monthRows = rows.filter((row) => row.id.startsWith(meta.prefix));
  const daily = monthRows.filter((row) => row.forecast_type === 'daily');
  const weekly = monthRows.filter((row) => row.forecast_type === 'weekly');
  const lastSync = maxUpdated(monthRows);
  return {
    ...meta,
    dailyLive: daily.filter(isLive).length,
    dailyPending: daily.filter((row) => !isLive(row)).length,
    weeklyLive: weekly.filter(isLive).length,
    weeklyPending: weekly.filter((row) => !isLive(row)).length,
    lastSync,
    stale: stale && (!lastSync || Date.now() - new Date(lastSync).getTime() > FORECAST_STALE_AFTER_HOURS * 3600e3),
  };
}

/**
 * Build dashboard overview stats from forecast db rows.
 * Pure function over row data so it can be unit tested without supabase.
 */
export function buildForecastOverview(rows: IForecastRow[], refDate = new Date()): IForecastOverview {
  const liveSeasonal = rows
    .filter((row) => row.forecast_type === 'seasonal' && isLive(row))
    .sort((a, b) => (a.id < b.id ? 1 : -1));
  const downscaledLocations = new Set(
    rows
      .filter((row) => row.forecast_type === 'downscaled' && isLive(row) && row.downscaled_location)
      .map((row) => row.downscaled_location),
  );
  return {
    current: summariseMonth(rows, monthMeta(refDate, 0), true),
    previous: summariseMonth(rows, monthMeta(refDate, -1), false),
    seasonalLatest: liveSeasonal[0]?.label || null,
    downscaledLocations: downscaledLocations.size,
    lastSync: maxUpdated(rows),
  };
}
