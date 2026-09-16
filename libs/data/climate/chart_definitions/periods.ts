import { MONTH_DATA } from '@picsa/data';
import type { IChartMeta, IThreeMonthPeriod } from '@picsa/models';

/**
 * Full calendar year months (January to December).
 */
export const ALL_CALENDAR_MONTHS: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * Default active 1-month choices (October to June) for seasonal rainfall.
 * Excludes July, August, September which have near-zero rainfall in Southern Africa.
 */
export const DEFAULT_ACTIVE_MONTHS: number[] = [10, 11, 12, 1, 2, 3, 4, 5, 6];

/**
 * Country-specific active months configuration.
 */
export const COUNTRY_ACTIVE_MONTHS: Record<string, number[]> = {
  mw: DEFAULT_ACTIVE_MONTHS,
  zm: DEFAULT_ACTIVE_MONTHS,
  zw: DEFAULT_ACTIVE_MONTHS,
  default: DEFAULT_ACTIVE_MONTHS,
};

export function getActiveMonthsForCountry(countryCode?: string): number[] {
  const code = countryCode?.toLowerCase() || 'default';
  return COUNTRY_ACTIVE_MONTHS[code] || COUNTRY_ACTIVE_MONTHS['default'] || DEFAULT_ACTIVE_MONTHS;
}

/**
 * Resolves available 1-month options for a specific chart definition and country.
 * Full-range charts (e.g. temperature) return all 12 calendar months;
 * seasonal charts (e.g. rainfall) return the country active growing season months.
 */
export function getMonthsForChart(chart?: IChartMeta, countryCode?: string): number[] {
  if (chart?.timespanRange === 'full') {
    return ALL_CALENDAR_MONTHS;
  }
  return getActiveMonthsForCountry(countryCode);
}

/**
 * All 12 running 3-month climatological periods across the full year.
 * Standard meteorological sequence starting with DJF.
 */
export const ALL_THREE_MONTH_PERIODS: IThreeMonthPeriod[] = [
  { id: 'djf', code: 'DJF', months: [12, 1, 2], primary: true },
  { id: 'jfm', code: 'JFM', months: [1, 2, 3] },
  { id: 'fma', code: 'FMA', months: [2, 3, 4] },
  { id: 'mam', code: 'MAM', months: [3, 4, 5] },
  { id: 'amj', code: 'AMJ', months: [4, 5, 6] },
  { id: 'mjj', code: 'MJJ', months: [5, 6, 7] },
  { id: 'jja', code: 'JJA', months: [6, 7, 8] },
  { id: 'jas', code: 'JAS', months: [7, 8, 9] },
  { id: 'aso', code: 'ASO', months: [8, 9, 10] },
  { id: 'son', code: 'SON', months: [9, 10, 11] },
  { id: 'ond', code: 'OND', months: [10, 11, 12] },
  { id: 'ndj', code: 'NDJ', months: [11, 12, 1] },
];

/**
 * Standard 3-month climatological periods for seasonal rainfall.
 * Climatological systems in Southern Africa index agricultural seasons starting July 1st,
 * so months [12, 1, 2] represent December through February belonging to that season year.
 * Labels are NOT hardcoded here — use formatThreeMonthPeriodLabel() or MONTH_DATA translations.
 */
export const DEFAULT_THREE_MONTH_PERIODS: IThreeMonthPeriod[] = [
  { id: 'ond', code: 'OND', months: [10, 11, 12] },
  { id: 'ndj', code: 'NDJ', months: [11, 12, 1] },
  { id: 'djf', code: 'DJF', months: [12, 1, 2], primary: true },
  { id: 'jfm', code: 'JFM', months: [1, 2, 3] },
  { id: 'fma', code: 'FMA', months: [2, 3, 4] },
];

/**
 * Country-specific 3-month period configurations.
 * Can be overridden per country if national meteorological services publish different periods.
 */
export const COUNTRY_THREE_MONTH_PERIODS: Record<string, IThreeMonthPeriod[]> = {
  mw: DEFAULT_THREE_MONTH_PERIODS,
  zm: DEFAULT_THREE_MONTH_PERIODS,
  zw: DEFAULT_THREE_MONTH_PERIODS,
  default: DEFAULT_THREE_MONTH_PERIODS,
};

export function getActivePeriodsForCountry(countryCode?: string): IThreeMonthPeriod[] {
  const code = countryCode?.toLowerCase() || 'default';
  return COUNTRY_THREE_MONTH_PERIODS[code] || COUNTRY_THREE_MONTH_PERIODS['default'] || DEFAULT_THREE_MONTH_PERIODS;
}

/**
 * Resolves available 3-month periods for a specific chart definition and country.
 * Full-range charts (e.g. temperature) return all 12 climatological periods;
 * seasonal charts (e.g. rainfall) return the country active growing season periods.
 */
export function getPeriodsForChart(chart?: IChartMeta, countryCode?: string): IThreeMonthPeriod[] {
  if (chart?.timespanRange === 'full') {
    return ALL_THREE_MONTH_PERIODS;
  }
  return getActivePeriodsForCountry(countryCode);
}

/**
 * Formats a user-facing label for a 3-month period using localized month abbreviations.
 * If a monthNames array (length 12) is provided (e.g. from translateService/signal),
 * localized names are used. Otherwise falls back to English MONTH_DATA.
 *
 * Example: formatThreeMonthPeriodLabel(djf) -> "Dec – Feb (DJF)"
 *
 * @param period The 3-month period definition
 * @param monthNames Optional array of 12 translated short month names (index 0 = Jan, 11 = Dec)
 */
export function formatThreeMonthPeriodLabel(period: IThreeMonthPeriod, monthNames?: string[]): string {
  const startMonthIndex = period.months[0] - 1;
  const endMonthIndex = period.months[2] - 1;

  const startName = monthNames?.[startMonthIndex] || MONTH_DATA[startMonthIndex]?.labelShort || '';
  const endName = monthNames?.[endMonthIndex] || MONTH_DATA[endMonthIndex]?.labelShort || '';

  if (!startName || !endName) {
    return period.code;
  }
  return `${startName} – ${endName} (${period.code})`;
}
