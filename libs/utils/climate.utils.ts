import type {
  IChartId,
  IClimateAuditReport,
  IHistoricalRevision,
  IIncomingClimateRecord,
  IMissingnessRegression,
  IMonthlyStationData,
  ISanityViolation,
  IStationAuditSummary,
  IStationCapabilities,
  IStationData,
  IThreeMonthPeriod,
} from '@picsa/models';

/**
 * Standard rounding for climate physical observations.
 * Eliminates float precision noise and ensures deterministic diffs.
 */
export function roundClimateValue(val: number | null | undefined): number | null {
  if (val === null || val === undefined || Number.isNaN(val)) {
    return null;
  }
  const rounded = Math.round(val * 10) / 10;
  return rounded === 0 ? 0 : rounded;
}

/**
 * Normalize time_value into YYYY-MM format.
 * Supports '1950-07', '1950-7', '1950/07', or ISO date strings.
 */
export function normalizeMonthKey(timeValue: string): string {
  if (!timeValue) return '';
  const trimmed = timeValue.trim();
  // Match YYYY[-/]M or YYYY[-/]MM
  const match = trimmed.match(/^(\d{4})[-/](\d{1,2})/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    return `${year}-${month}`;
  }
  return trimmed;
}

/**
 * Normalize element names from various meteorological systems.
 */
function normalizeElementName(element: string): keyof Omit<IMonthlyStationData, 'month'> | null {
  const normalized = element.toLowerCase().trim();
  switch (normalized) {
    case 'rainfall':
    case 'rain':
    case 'precip':
    case 'seasonal_rain':
      return 'Rainfall';
    case 'min_tmin':
      return 'min_tmin';
    case 'mean_tmin':
      return 'mean_tmin';
    case 'mean_tmax':
      return 'mean_tmax';
    case 'max_tmax':
      return 'max_tmax';
    case 'min_tmax':
      return 'min_tmax';
    case 'max_tmin':
      return 'max_tmin';
    default:
      return null;
  }
}

/** Event emitted when duplicate records for the same month and element are encountered during pivoting */
export interface IPivotDuplicateRecord {
  stationId?: string;
  month: string;
  element: string;
  existingValue: number | null;
  incomingValue: number | null;
  isConflict: boolean;
}

export interface IPivotOptions {
  /** Optional callback invoked whenever a duplicate record for a (month, element) pair is encountered */
  onDuplicate?: (duplicate: IPivotDuplicateRecord) => void;
  /** Deduplication resolution: 'last-wins' (default) or 'keep-first' */
  resolution?: 'last-wins' | 'keep-first';
}

/**
 * Transform incoming long-format climate records into wide monthly station records.
 * Detects within-batch duplicates and surfaces conflicting observations via optional callback/warnings.
 * Sorts chronologically by month ascending (YYYY-MM).
 */
export function pivotLongToWideMonthly(
  records: IIncomingClimateRecord[],
  options?: IPivotOptions,
): IMonthlyStationData[] {
  const monthMap = new Map<string, IMonthlyStationData>();

  for (const record of records) {
    const month = normalizeMonthKey(record.time_value);
    if (!month) continue;

    const elementKey = normalizeElementName(record.summary_element);
    if (!elementKey) continue;

    let entry = monthMap.get(month);
    if (!entry) {
      entry = { month };
      monthMap.set(month, entry);
    }

    const roundedVal = roundClimateValue(record.summary_value);

    // Check for within-batch duplicate record
    if (entry[elementKey] !== undefined) {
      const existingVal = entry[elementKey] ?? null;
      const isConflict = existingVal !== roundedVal;

      if (options?.onDuplicate) {
        options.onDuplicate({
          stationId: record.station_id,
          month,
          element: elementKey,
          existingValue: existingVal,
          incomingValue: roundedVal,
          isConflict,
        });
      }

      if (isConflict) {
        console.warn(
          `[pivotLongToWideMonthly] Conflicting duplicate observation for station '${record.station_id || 'unknown'}', month ${month}, element '${elementKey}': earlier value was ${existingVal}, incoming value is ${roundedVal}.`,
        );
      }

      if (options?.resolution === 'keep-first') {
        continue;
      }
    }

    entry[elementKey] = roundedVal;
  }

  // Sort chronologically ascending
  return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Check if station has valid observations for any temperature metrics.
 */
export function stationHasTemperatureData(data: IMonthlyStationData[]): boolean {
  return data.some(
    (row) =>
      (row.min_tmin !== undefined && row.min_tmin !== null) ||
      (row.mean_tmin !== undefined && row.mean_tmin !== null) ||
      (row.mean_tmax !== undefined && row.mean_tmax !== null) ||
      (row.max_tmax !== undefined && row.max_tmax !== null) ||
      (row.min_tmax !== undefined && row.min_tmax !== null) ||
      (row.max_tmin !== undefined && row.max_tmin !== null),
  );
}

/**
 * Format monthly station records as wide CSV string.
 * Omits temperature columns if station is rain-only to keep bundle sizes compact.
 * Missing values are formatted as empty cells (,,).
 */
export function formatMonthlyCsv(data: IMonthlyStationData[], includeTemperature?: boolean): string {
  const hasTemp = includeTemperature ?? stationHasTemperatureData(data);

  if (!hasTemp) {
    let csv = 'month,Rainfall\n';
    for (const row of data) {
      const rain = row.Rainfall !== undefined && row.Rainfall !== null ? row.Rainfall : '';
      csv += `${row.month},${rain}\n`;
    }
    return csv;
  }

  let csv = 'month,Rainfall,min_tmin,mean_tmin,max_tmin,min_tmax,mean_tmax,max_tmax\n';
  for (const row of data) {
    const rain = row.Rainfall !== undefined && row.Rainfall !== null ? row.Rainfall : '';
    const minTmin = row.min_tmin !== undefined && row.min_tmin !== null ? row.min_tmin : '';
    const meanTmin = row.mean_tmin !== undefined && row.mean_tmin !== null ? row.mean_tmin : '';
    const maxTmin = row.max_tmin !== undefined && row.max_tmin !== null ? row.max_tmin : '';
    const minTmax = row.min_tmax !== undefined && row.min_tmax !== null ? row.min_tmax : '';
    const meanTmax = row.mean_tmax !== undefined && row.mean_tmax !== null ? row.mean_tmax : '';
    const maxTmax = row.max_tmax !== undefined && row.max_tmax !== null ? row.max_tmax : '';
    csv += `${row.month},${rain},${minTmin},${meanTmin},${maxTmin},${minTmax},${meanTmax},${maxTmax}\n`;
  }
  return csv;
}

/**
 * Parse wide monthly CSV text into IMonthlyStationData rows.
 */
export function parseMonthlyCsv(csvText: string): IMonthlyStationData[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows: IMonthlyStationData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    const entry: IMonthlyStationData = { month: parts[0]?.trim() || '' };

    for (let h = 1; h < headers.length; h++) {
      const header = headers[h] as keyof Omit<IMonthlyStationData, 'month'>;
      const rawVal = parts[h]?.trim();
      if (rawVal !== undefined && rawVal !== '' && rawVal !== 'null') {
        const num = Number(rawVal);
        entry[header] = Number.isNaN(num) ? null : roundClimateValue(num);
      } else {
        entry[header] = null;
      }
    }
    rows.push(entry);
  }

  return rows.sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Parse annual station summary CSV or TSV text into IStationData rows.
 * Automatically handles comma or tab delimiters, strips UTF-8 BOM,
 * and converts legacy '0' missing placeholders for season metrics into nulls.
 */
export function parseAnnualCsv(csvText: string): IStationData[] {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  const lines = cleanText.split(/\r?\n/);
  if (lines.length <= 1) return [];

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delimiter).map((h) => h.trim());
  const rows: IStationData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(delimiter);
    const rowObj: Record<string, any> = {};

    for (let h = 0; h < headers.length; h++) {
      const header = headers[h];
      const rawVal = parts[h]?.trim();
      if (rawVal !== undefined && rawVal !== '' && rawVal !== 'null') {
        const num = Number(rawVal);
        rowObj[header] = Number.isNaN(num) ? rawVal : num;
      } else {
        rowObj[header] = null;
      }
    }

    const yearVal = rowObj['Year'] ?? rowObj['year'];
    if (typeof yearVal !== 'number' || Number.isNaN(yearVal)) continue;

    // In legacy climate data (e.g. Zimbabwe), 0 in Start, End, Length, Rainfall represents missing data
    const isAllZeros =
      rowObj['Start'] === 0 && rowObj['End'] === 0 && rowObj['Length'] === 0 && rowObj['Rainfall'] === 0;

    const entry: IStationData = {
      Year: yearVal,
      Start: isAllZeros ? (null as any) : rowObj['Start'],
      End: isAllZeros ? (null as any) : rowObj['End'],
      Length: isAllZeros ? (null as any) : rowObj['Length'],
      Rainfall: isAllZeros ? (null as any) : rowObj['Rainfall'],
      Extreme_events: rowObj['Extreme_events'] ?? rowObj['extreme_events'],
      min_tmin: rowObj['min_tmin'],
      mean_tmin: rowObj['mean_tmin'],
      max_tmin: rowObj['max_tmin'],
      min_tmax: rowObj['min_tmax'],
      mean_tmax: rowObj['mean_tmax'],
      max_tmax: rowObj['max_tmax'],
    };

    rows.push(entry);
  }

  return rows.sort((a, b) => a.Year - b.Year);
}

/**
 * Analyze station data (annual and monthly) to generate typed IStationCapabilities.
 */
export function calculateStationCapabilities(params: {
  annualData?: IStationData[];
  monthlyData?: IMonthlyStationData[];
  contentHash?: string;
  schemaVersion?: number;
  lastUpdated?: string;
}): IStationCapabilities {
  const { annualData = [], monthlyData = [], contentHash, schemaVersion = 1, lastUpdated } = params;

  let firstYear: number | undefined;
  let lastYear: number | undefined;

  // Compute year bounds from annual data
  for (const row of annualData) {
    if (typeof row.Year === 'number' && !Number.isNaN(row.Year)) {
      if (firstYear === undefined || row.Year < firstYear) firstYear = row.Year;
      if (lastYear === undefined || row.Year > lastYear) lastYear = row.Year;
    }
  }

  // Only fall back to monthly data for year bounds if annual data is absent
  if (firstYear === undefined && lastYear === undefined) {
    for (const row of monthlyData) {
      const yr = Number.parseInt(row.month.slice(0, 4), 10);
      if (!Number.isNaN(yr)) {
        if (firstYear === undefined || yr < firstYear) firstYear = yr;
        if (lastYear === undefined || yr > lastYear) lastYear = yr;
      }
    }
  }

  // Detect available annual charts
  const annualCharts: IChartId[] = [];
  const checkAnnualField = (key: keyof IStationData) =>
    annualData.some((row) => row[key] !== undefined && row[key] !== null && row[key] !== ('' as any));

  if (checkAnnualField('Rainfall')) annualCharts.push('rainfall');
  if (checkAnnualField('Start')) annualCharts.push('start');
  if (checkAnnualField('End')) annualCharts.push('end');
  if (checkAnnualField('Length')) annualCharts.push('length');
  if (checkAnnualField('Extreme_events')) annualCharts.push('extreme_rainfall_days');
  if (checkAnnualField('min_tmin') || checkAnnualField('mean_tmin') || checkAnnualField('max_tmin')) {
    annualCharts.push('temp_min');
  }
  if (checkAnnualField('min_tmax') || checkAnnualField('mean_tmax') || checkAnnualField('max_tmax')) {
    annualCharts.push('temp_max');
  }

  // Detect available monthly charts
  const monthlyCharts: IChartId[] = [];
  const hasMonthlyRain = monthlyData.some((row) => row.Rainfall !== undefined && row.Rainfall !== null);
  if (hasMonthlyRain) monthlyCharts.push('rainfall');

  const hasMonthlyMinTemp = monthlyData.some(
    (row) =>
      (row.min_tmin !== undefined && row.min_tmin !== null) ||
      (row.mean_tmin !== undefined && row.mean_tmin !== null) ||
      (row.max_tmin !== undefined && row.max_tmin !== null),
  );
  if (hasMonthlyMinTemp) monthlyCharts.push('temp_min');

  const hasMonthlyMaxTemp = monthlyData.some(
    (row) =>
      (row.min_tmax !== undefined && row.min_tmax !== null) ||
      (row.mean_tmax !== undefined && row.mean_tmax !== null) ||
      (row.max_tmax !== undefined && row.max_tmax !== null),
  );
  if (hasMonthlyMaxTemp) monthlyCharts.push('temp_max');

  // Compute completeRainYears and completeTempYears
  let completeRainYears: number | undefined;
  let completeTempYears: number | undefined;

  if (annualData.length > 0) {
    let rainCount = 0;
    let tempCount = 0;
    let hasAnyTempData = false;

    for (const row of annualData) {
      if (typeof row.Year !== 'number' || Number.isNaN(row.Year)) continue;

      // Complete rain year requires all 4 seasonal metrics (Rainfall, Start, End, Length)
      const isCompleteRain =
        typeof row.Rainfall === 'number' &&
        !Number.isNaN(row.Rainfall) &&
        typeof row.Start === 'number' &&
        !Number.isNaN(row.Start) &&
        typeof row.End === 'number' &&
        !Number.isNaN(row.End) &&
        typeof row.Length === 'number' &&
        !Number.isNaN(row.Length);

      if (isCompleteRain) {
        rainCount++;
      }

      // Complete temp year requires all 4 essential plotted metrics (min_tmin, mean_tmin, max_tmax, mean_tmax)
      const hasTempInRow =
        typeof row.min_tmin === 'number' ||
        typeof row.mean_tmin === 'number' ||
        typeof row.mean_tmax === 'number' ||
        typeof row.max_tmax === 'number';

      if (hasTempInRow) {
        hasAnyTempData = true;
      }

      const isCompleteTemp =
        typeof row.min_tmin === 'number' &&
        !Number.isNaN(row.min_tmin) &&
        typeof row.mean_tmin === 'number' &&
        !Number.isNaN(row.mean_tmin) &&
        typeof row.mean_tmax === 'number' &&
        !Number.isNaN(row.mean_tmax) &&
        typeof row.max_tmax === 'number' &&
        !Number.isNaN(row.max_tmax);

      if (isCompleteTemp) {
        tempCount++;
      }
    }

    completeRainYears = rainCount;
    if (hasAnyTempData || annualCharts.includes('temp_min') || annualCharts.includes('temp_max')) {
      completeTempYears = tempCount;
    }
  }

  const totalYears = firstYear !== undefined && lastYear !== undefined ? lastYear - firstYear + 1 : undefined;

  return {
    schemaVersion,
    lastUpdated: lastUpdated || new Date().toISOString().slice(0, 10),
    contentHash,
    years: firstYear !== undefined && lastYear !== undefined ? [firstYear, lastYear] : [],
    totalYears,
    completeRainYears,
    completeTempYears,
    annual: annualCharts.length > 0 ? annualCharts : undefined,
    monthly: monthlyCharts.length > 0 ? monthlyCharts : undefined,
  };
}

/**
 * Audit comparison between existing and incoming monthly records.
 * Identifies historical revisions, missingness regressions, and physical sanity violations.
 */
export function auditMonthlyChanges(params: {
  stationId: string;
  existingData: IMonthlyStationData[];
  incomingData: IMonthlyStationData[];
}): {
  revisions: IHistoricalRevision[];
  regressions: IMissingnessRegression[];
  sanityViolations: ISanityViolation[];
} {
  const { stationId, existingData, incomingData } = params;
  const revisions: IHistoricalRevision[] = [];
  const regressions: IMissingnessRegression[] = [];
  const sanityViolations: ISanityViolation[] = [];

  const existingMap = new Map<string, IMonthlyStationData>();
  for (const row of existingData) {
    existingMap.set(row.month, row);
  }

  const metrics: Array<keyof Omit<IMonthlyStationData, 'month'>> = [
    'Rainfall',
    'min_tmin',
    'mean_tmin',
    'mean_tmax',
    'max_tmax',
    'min_tmax',
    'max_tmin',
  ];

  for (const incomingRow of incomingData) {
    const month = incomingRow.month;
    const existingRow = existingMap.get(month);

    // 1. Check for physical sanity violations on incoming data
    // Date format validation
    const monthParts = month.split('-');
    const mm = Number.parseInt(monthParts[1], 10);
    if (Number.isNaN(mm) || mm < 1 || mm > 12) {
      sanityViolations.push({
        stationId,
        month,
        rule: 'CALENDAR_MONTH_RANGE',
        message: `Month ${month} has invalid month index ${mm}`,
        values: { month },
      });
    }

    // Rainfall non-negative
    if (incomingRow.Rainfall !== undefined && incomingRow.Rainfall !== null) {
      if (incomingRow.Rainfall < 0) {
        sanityViolations.push({
          stationId,
          month,
          rule: 'RAINFALL_NON_NEGATIVE',
          message: `Rainfall is negative: ${incomingRow.Rainfall} mm`,
          values: { Rainfall: incomingRow.Rainfall },
        });
      } else if (incomingRow.Rainfall > 1500) {
        sanityViolations.push({
          stationId,
          month,
          rule: 'RAINFALL_EXTREME_OUTLIER',
          message: `Monthly rainfall exceeds 1500mm threshold: ${incomingRow.Rainfall} mm`,
          values: { Rainfall: incomingRow.Rainfall },
        });
      }
    }

    // Temperature ordering checks
    const { min_tmin, mean_tmin, mean_tmax, max_tmax } = incomingRow;
    if (min_tmin !== null && min_tmin !== undefined && mean_tmin !== null && mean_tmin !== undefined) {
      if (min_tmin > mean_tmin) {
        sanityViolations.push({
          stationId,
          month,
          rule: 'TEMP_MIN_EXCEEDS_MEAN',
          message: `min_tmin (${min_tmin}°C) is greater than mean_tmin (${mean_tmin}°C)`,
          values: { min_tmin, mean_tmin },
        });
      }
    }

    if (mean_tmax !== null && mean_tmax !== undefined && max_tmax !== null && max_tmax !== undefined) {
      if (mean_tmax > max_tmax) {
        sanityViolations.push({
          stationId,
          month,
          rule: 'TEMP_MEAN_EXCEEDS_MAX',
          message: `mean_tmax (${mean_tmax}°C) is greater than max_tmax (${max_tmax}°C)`,
          values: { mean_tmax, max_tmax },
        });
      }
    }

    if (mean_tmin !== null && mean_tmin !== undefined && mean_tmax !== null && mean_tmax !== undefined) {
      if (mean_tmin > mean_tmax) {
        sanityViolations.push({
          stationId,
          month,
          rule: 'TEMP_INVERSION_TMIN_TMAX',
          message: `mean_tmin (${mean_tmin}°C) is greater than mean_tmax (${mean_tmax}°C)`,
          values: { mean_tmin, mean_tmax },
        });
      }
    }

    // 2. Diffing against existing published data
    if (existingRow) {
      for (const metric of metrics) {
        const oldVal = existingRow[metric];
        const newVal = incomingRow[metric];

        // Flag missingness regression: previous valid value became null
        if (oldVal !== undefined && oldVal !== null && (newVal === undefined || newVal === null)) {
          regressions.push({
            stationId,
            month,
            metric,
            previousValue: oldVal,
          });
          continue;
        }

        // Flag historical revision if both are numbers and difference > 0.05
        if (typeof oldVal === 'number' && typeof newVal === 'number' && Math.abs(oldVal - newVal) > 0.05) {
          revisions.push({
            stationId,
            month,
            metric,
            oldValue: oldVal,
            newValue: newVal,
            diff: roundClimateValue(newVal - oldVal) || 0,
          });
        }
      }
    }
  }

  return { revisions, regressions, sanityViolations };
}

/**
 * Format audit report into markdown tables for PR reviews and CI logging.
 */
function formatMetricWithDiff(val: number | undefined, diff: number | undefined): string {
  if (val === undefined) {
    return '—';
  }
  if (diff !== undefined && diff !== 0) {
    const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
    return `${val} (${diffStr})`;
  }
  return `${val}`;
}

/**
 * Format a list of station audit summaries into a markdown table.
 */
function formatStationsTable(stations: IStationAuditSummary[]): string {
  let md = `| Country | Station ID | Status | Historical Range | Total Yrs | Complete Rain Yrs | Complete Temp Yrs | Monthly Charts | Content Hash |\n`;
  md += `| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |\n`;

  for (const s of stations) {
    let country = s.country ? s.country.toUpperCase() : '—';
    let stationId = s.id;
    if (stationId.includes(':')) {
      const parts = stationId.split(':');
      if (country === '—') {
        country = parts[0].toUpperCase();
      }
      stationId = parts.slice(1).join(':');
    }

    const range = s.years && s.years.length === 2 ? `${s.years[0]}–${s.years[1]}` : 'N/A';
    const totalYrs = formatMetricWithDiff(s.totalYears, s.diffTotalYears);
    const rain = formatMetricWithDiff(s.completeRainYears, s.diffCompleteRainYears);
    const temp = formatMetricWithDiff(s.completeTempYears, s.diffCompleteTempYears);
    const monthlyCharts = s.monthly && s.monthly.length > 0 ? s.monthly.join(', ') : '—';
    const hash = s.hash ? `\`${s.hash.slice(0, 10)}...\`` : '—';
    md += `| ${country} | **${stationId}** | \`${s.status}\` | ${range} | ${totalYrs} | ${rain} | ${temp} | ${monthlyCharts} | ${hash} |\n`;
  }
  return md;
}

/**
 * Format a list of stations into a simple 2-column markdown table (Country, Station ID).
 */
function formatSimpleStationsTable(stations: IStationAuditSummary[]): string {
  let md = `| Country | Station ID |\n`;
  md += `| :---: | :--- |\n`;

  for (const s of stations) {
    let country = s.country ? s.country.toUpperCase() : '—';
    let stationId = s.id;
    if (stationId.includes(':')) {
      const parts = stationId.split(':');
      if (country === '—') {
        country = parts[0].toUpperCase();
      }
      stationId = parts.slice(1).join(':');
    }
    md += `| ${country} | **${stationId}** |\n`;
  }
  return md;
}

export function generateMarkdownAuditReport(report: IClimateAuditReport): string {
  const {
    timestamp,
    totalStationsProcessed,
    stationsSummary = [],
    historicalRevisions = [],
    missingnessRegressions = [],
    sanityViolations = [],
    warnings = [],
  } = report;

  const totalWarnings = warnings.length;

  let md = `# Climate Data Sync & Health Audit Report\n\n`;
  md += `**Execution Time**: \`${timestamp}\`  \n`;
  md += `**Total Stations Processed**: \`${totalStationsProcessed}\`  \n`;
  md += `**Total Warnings**: \`${totalWarnings}\`\n\n`;

  // 1. Stations Summary - categorize into Subtractive, Additive, Value-Update Only, and Unchanged
  const changedStations = stationsSummary.filter((s) => s.status !== 'UNCHANGED');
  const unchangedStations = stationsSummary.filter((s) => s.status === 'UNCHANGED');

  const isSubtractive = (s: IStationAuditSummary): boolean => {
    return (
      (s.diffTotalYears !== undefined && s.diffTotalYears < 0) ||
      (s.diffCompleteRainYears !== undefined && s.diffCompleteRainYears < 0) ||
      (s.diffCompleteTempYears !== undefined && s.diffCompleteTempYears < 0)
    );
  };

  const isAdditive = (s: IStationAuditSummary): boolean => {
    if (isSubtractive(s)) {
      return false;
    }
    return (
      s.status === 'NEW' ||
      (s.diffTotalYears !== undefined && s.diffTotalYears > 0) ||
      (s.diffCompleteRainYears !== undefined && s.diffCompleteRainYears > 0) ||
      (s.diffCompleteTempYears !== undefined && s.diffCompleteTempYears > 0)
    );
  };

  const subtractiveStations = changedStations.filter(isSubtractive);
  const additiveStations = changedStations.filter(isAdditive);
  const valueUpdateStations = changedStations.filter((s) => !isSubtractive(s) && !isAdditive(s));

  const sortStations = (a: IStationAuditSummary, b: IStationAuditSummary) => {
    const cA = a.country || (a.id.includes(':') ? a.id.split(':')[0] : '');
    const cB = b.country || (b.id.includes(':') ? b.id.split(':')[0] : '');
    const countryCompare = cA.localeCompare(cB);
    if (countryCompare !== 0) return countryCompare;
    const idA = a.id.includes(':') ? a.id.split(':')[1] : a.id;
    const idB = b.id.includes(':') ? b.id.split(':')[1] : b.id;
    return idA.localeCompare(idB);
  };

  subtractiveStations.sort(sortStations);
  additiveStations.sort(sortStations);
  valueUpdateStations.sort(sortStations);
  unchangedStations.sort(sortStations);

  md += `## 1. Stations Summary\n\n`;

  // 1.1 Subtractive changes (displayed first, independently)
  md += `### Subtractive Changes (${subtractiveStations.length})\n\n`;
  if (subtractiveStations.length === 0) {
    md += `*No stations with subtractive changes.*\n\n`;
  } else {
    md += `<details open>\n`;
    md += `<summary><strong>Subtractive Changes (${subtractiveStations.length})</strong></summary>\n\n`;
    md += formatStationsTable(subtractiveStations);
    md += `\n</details>\n\n`;
  }

  // 1.2 Additive changes (displayed second)
  md += `### Additive Changes (${additiveStations.length})\n\n`;
  if (additiveStations.length === 0) {
    md += `*No stations with additive changes.*\n\n`;
  } else {
    md += `<details open>\n`;
    md += `<summary><strong>Additive Changes (${additiveStations.length})</strong></summary>\n\n`;
    md += formatStationsTable(additiveStations);
    md += `\n</details>\n\n`;
  }

  // 1.3 Value-update only (displayed third, simple 2-column table)
  md += `### Value-Update Only (${valueUpdateStations.length})\n\n`;
  if (valueUpdateStations.length === 0) {
    md += `*No stations with value-only updates.*\n\n`;
  } else {
    md += `<details open>\n`;
    md += `<summary><strong>Value-Update Only (${valueUpdateStations.length})</strong></summary>\n\n`;
    md += formatSimpleStationsTable(valueUpdateStations);
    md += `\n</details>\n\n`;
  }

  // 1.4 Unchanged stations: collapsed/hidden by default
  md += `### Unchanged Stations (${unchangedStations.length})\n\n`;
  if (unchangedStations.length === 0) {
    md += `*No unchanged stations.*\n\n`;
  } else {
    md += `<details>\n`;
    md += `<summary><strong>Unchanged Stations (${unchangedStations.length})</strong> — click to expand</summary>\n\n`;
    md += formatStationsTable(unchangedStations);
    md += `\n</details>\n\n`;
  }

  // Historical revisions table
  md += `## 2. Historical Revisions (${historicalRevisions.length})\n\n`;
  if (historicalRevisions.length === 0) {
    md += `*No previously published historical data was modified.*\n\n`;
  } else {
    md += `> [!WARNING]\n`;
    md += `> Previously published records have been modified in this sync. Review changes carefully before merging.\n\n`;
    md += `| Station | Month | Metric | Previous Value | New Value | Change |\n`;
    md += `| :--- | :---: | :--- | :---: | :---: | :---: |\n`;
    for (const rev of historicalRevisions) {
      const sign = rev.diff > 0 ? `+${rev.diff}` : `${rev.diff}`;
      md += `| **${rev.stationId}** | \`${rev.month}\` | \`${rev.metric}\` | ${rev.oldValue} | ${rev.newValue} | **${sign}** |\n`;
    }
    md += `\n`;
  }

  // Missingness regressions
  md += `## 3. Missingness Regressions (${missingnessRegressions.length})\n\n`;
  if (missingnessRegressions.length === 0) {
    md += `*No regressions detected (no valid data became missing).*\n\n`;
  } else {
    md += `> [!CAUTION]\n`;
    md += `> The following previously valid observations became empty or null:\n\n`;
    md += `| Station | Month | Metric | Previous Value |\n`;
    md += `| :--- | :---: | :--- | :---: |\n`;
    for (const reg of missingnessRegressions) {
      md += `| **${reg.stationId}** | \`${reg.month}\` | \`${reg.metric}\` | ${reg.previousValue} |\n`;
    }
    md += `\n`;
  }

  // Sanity violations
  md += `## 4. Physical Consistency Sanity Checks (${sanityViolations.length})\n\n`;
  if (sanityViolations.length === 0) {
    md += `*All records passed temperature ordering, positive rainfall, and calendar sanity rules.*\n\n`;
  } else {
    md += `> [!WARNING]\n`;
    md += `> The following physical consistency checks failed:\n\n`;
    md += `| Station | Month | Rule | Message |\n`;
    md += `| :--- | :---: | :--- | :--- |\n`;
    for (const v of sanityViolations) {
      md += `| **${v.stationId}** | \`${v.month}\` | \`${v.rule}\` | ${v.message} |\n`;
    }
    md += `\n`;
  }

  // Warnings section: grouped by warning category/message
  md += `## 5. Sync Warnings (${totalWarnings})\n\n`;
  if (totalWarnings === 0) {
    md += `*No warnings were generated during this run.*\n\n`;
  } else {
    md += `> [!WARNING]\n`;
    md += `> The following operational warnings were encountered during sync:\n\n`;

    const warningGroups = new Map<string, Array<{ country?: string; stationId?: string }>>();

    for (const w of warnings) {
      let message = '';
      let country: string | undefined;
      let stationId: string | undefined;

      if (typeof w === 'object' && w !== null) {
        message = w.message;
        country = w.country;
        stationId = w.stationId;
      } else if (typeof w === 'string') {
        const metaMatch = w.match(/Station '([^']+)' has DB data but no entry in metadata\.ts/i);
        const zeroMatch = w.match(/Station '([^']+)' has DB record but zero annual data entries/i);
        const noRowsMatch = w.match(/No climate_station_data rows found in database for ([A-Za-z]+)/i);
        const assetsMatch = w.match(/Assets folder for country '([^']+)' does not exist/i);

        if (metaMatch) {
          message = 'Station has DB data but no entry in metadata.ts (unregistered station)';
          stationId = metaMatch[1];
        } else if (zeroMatch) {
          message = 'Station has database record but zero annual data entries';
          stationId = zeroMatch[1];
        } else if (noRowsMatch) {
          message = 'No climate_station_data rows found in database';
          country = noRowsMatch[1].toUpperCase();
        } else if (assetsMatch) {
          message = 'Assets folder does not exist for country';
          country = assetsMatch[1].toUpperCase();
        } else {
          message = w;
        }
      }

      if (!country && stationId && stationId.includes(':')) {
        const parts = stationId.split(':');
        country = parts[0].toUpperCase();
        stationId = parts[1];
      }

      const list = warningGroups.get(message) || [];
      list.push({ country, stationId });
      warningGroups.set(message, list);
    }

    for (const [msg, items] of warningGroups.entries()) {
      md += `### ${msg} (${items.length})\n\n`;

      const hasStations = items.some((item) => item.stationId);
      if (hasStations) {
        items.sort((a, b) => {
          const cDiff = (a.country || '').localeCompare(b.country || '');
          if (cDiff !== 0) return cDiff;
          return (a.stationId || '').localeCompare(b.stationId || '');
        });

        md += `| Country | Station ID |\n`;
        md += `| :---: | :--- |\n`;
        for (const item of items) {
          const c = item.country || '—';
          const s = item.stationId ? `**${item.stationId}**` : '—';
          md += `| ${c} | ${s} |\n`;
        }
        md += `\n`;
      } else {
        for (const item of items) {
          if (item.country) {
            md += `- **${item.country}**\n`;
          } else {
            md += `- ${msg}\n`;
          }
        }
        md += `\n`;
      }
    }
  }

  return md;
}

/**
 * Map a raw monthly station record into an IStationData observation row.
 */
function mapMonthlyRowToStationData(row: IMonthlyStationData): IStationData | null {
  if (!row.month) return null;
  const year = Number.parseInt(row.month.slice(0, 4), 10);
  if (Number.isNaN(year)) return null;

  return {
    Year: year,
    Start: null as any,
    End: null as any,
    Length: null as any,
    Rainfall: (row.Rainfall ?? null) as any,
    Extreme_events: null as any,
    min_tmin: (row.min_tmin ?? null) as any,
    mean_tmin: (row.mean_tmin ?? null) as any,
    max_tmin: (row.max_tmin ?? null) as any,
    min_tmax: (row.min_tmax ?? null) as any,
    mean_tmax: (row.mean_tmax ?? null) as any,
    max_tmax: (row.max_tmax ?? null) as any,
  };
}

/**
 * Filter monthly station data for a single calendar month (1-12) across all years.
 * Returns an array of IStationData rows with Year matching the calendar year.
 */
export function filterMonthlyDataByMonth(monthlyData: IMonthlyStationData[], targetMonth: number): IStationData[] {
  const monthSuffix = `-${String(targetMonth).padStart(2, '0')}`;
  const rows: IStationData[] = [];

  for (const row of monthlyData) {
    if (row.month && row.month.endsWith(monthSuffix)) {
      const mapped = mapMonthlyRowToStationData(row);
      if (mapped) rows.push(mapped);
    }
  }

  return rows.sort((a, b) => a.Year - b.Year);
}

/**
 * Convert all monthly station records across all calendar months into IStationData rows.
 * Used for computing station-wide 1-month axis bounds (Scale A).
 */
export function convertMonthlyToStationData(monthlyData: IMonthlyStationData[]): IStationData[] {
  const rows: IStationData[] = [];

  for (const row of monthlyData) {
    const mapped = mapMonthlyRowToStationData(row);
    if (mapped) rows.push(mapped);
  }

  return rows.sort((a, b) => a.Year - b.Year);
}

/**
 * Aggregates monthly station records into 3-month climatological seasonal series.
 * Aligns seasons to the Southern Africa agricultural year starting July 1st:
 * Months >= 7 (Jul-Dec) belong to season year Y.
 * Months < 7 (Jan-Jun) belong to season year Y (calendar year Y + 1).
 *
 * Rainfall requires complete data across all 3 months (strictly null if any month missing).
 * Temperatures aggregate extremes (min of min_tmin, max of max_tmax) and means.
 */
export function aggregateThreeMonthSeries(
  monthlyData: IMonthlyStationData[],
  period: IThreeMonthPeriod,
): IStationData[] {
  // Map season year -> Map<monthNumber, IMonthlyStationData>
  const seasonMap = new Map<number, Map<number, IMonthlyStationData>>();

  for (const row of monthlyData) {
    if (!row.month) continue;
    const parts = row.month.split('-');
    if (parts.length < 2) continue;
    const calYear = Number.parseInt(parts[0], 10);
    const monthNum = Number.parseInt(parts[1], 10);
    if (Number.isNaN(calYear) || Number.isNaN(monthNum)) continue;

    // Determine season year
    const seasonYear = monthNum >= 7 ? calYear : calYear - 1;

    if (!seasonMap.has(seasonYear)) {
      seasonMap.set(seasonYear, new Map<number, IMonthlyStationData>());
    }
    seasonMap.get(seasonYear)!.set(monthNum, row);
  }

  const result: IStationData[] = [];
  const requiredMonths = period.months; // e.g. [12, 1, 2]

  for (const [seasonYear, monthsMap] of seasonMap.entries()) {
    // Check rainfall completeness
    let rainfallSum: number | null = 0;
    for (const m of requiredMonths) {
      const row = monthsMap.get(m);
      if (!row || row.Rainfall === undefined || row.Rainfall === null || Number.isNaN(row.Rainfall)) {
        rainfallSum = null;
        break;
      }
      rainfallSum += row.Rainfall;
    }
    if (rainfallSum !== null) {
      rainfallSum = roundClimateValue(rainfallSum);
    }

    // Aggregate temperatures
    let minTmin: number | null = null;
    let maxTmax: number | null = null;
    let minTmax: number | null = null;
    let maxTmin: number | null = null;
    let sumMeanTmin = 0;
    let countMeanTmin = 0;
    let sumMeanTmax = 0;
    let countMeanTmax = 0;

    for (const m of requiredMonths) {
      const row = monthsMap.get(m);
      if (!row) continue;

      if (typeof row.min_tmin === 'number' && !Number.isNaN(row.min_tmin)) {
        minTmin = minTmin === null ? row.min_tmin : Math.min(minTmin, row.min_tmin);
      }
      if (typeof row.max_tmax === 'number' && !Number.isNaN(row.max_tmax)) {
        maxTmax = maxTmax === null ? row.max_tmax : Math.max(maxTmax, row.max_tmax);
      }
      if (typeof row.min_tmax === 'number' && !Number.isNaN(row.min_tmax)) {
        minTmax = minTmax === null ? row.min_tmax : Math.min(minTmax, row.min_tmax);
      }
      if (typeof row.max_tmin === 'number' && !Number.isNaN(row.max_tmin)) {
        maxTmin = maxTmin === null ? row.max_tmin : Math.max(maxTmin, row.max_tmin);
      }
      if (typeof row.mean_tmin === 'number' && !Number.isNaN(row.mean_tmin)) {
        sumMeanTmin += row.mean_tmin;
        countMeanTmin++;
      }
      if (typeof row.mean_tmax === 'number' && !Number.isNaN(row.mean_tmax)) {
        sumMeanTmax += row.mean_tmax;
        countMeanTmax++;
      }
    }

    const meanTmin = countMeanTmin > 0 ? roundClimateValue(sumMeanTmin / countMeanTmin) : null;
    const meanTmax = countMeanTmax > 0 ? roundClimateValue(sumMeanTmax / countMeanTmax) : null;

    // If there were any observations for this season year, emit the season row
    if (monthsMap.size > 0) {
      result.push({
        Year: seasonYear,
        Start: null as any,
        End: null as any,
        Length: null as any,
        Rainfall: rainfallSum as any,
        Extreme_events: null as any,
        min_tmin: (minTmin !== null ? roundClimateValue(minTmin) : null) as any,
        mean_tmin: meanTmin as any,
        max_tmin: (maxTmin !== null ? roundClimateValue(maxTmin) : null) as any,
        min_tmax: (minTmax !== null ? roundClimateValue(minTmax) : null) as any,
        mean_tmax: meanTmax as any,
        max_tmax: (maxTmax !== null ? roundClimateValue(maxTmax) : null) as any,
      });
    }
  }

  return result.sort((a, b) => a.Year - b.Year);
}

/**
 * Convert database annual rainfall and temperature summary arrays into unified IStationData rows.
 * Merges entries by year and handles country-specific DOY mappings and temperature rounding.
 */
export function convertStationSummariesToRows(
  annualRainfallData?: any[] | null,
  annualTemperatureData?: any[] | null,
): IStationData[] {
  const rainfall = annualRainfallData ?? [];
  const temperature = annualTemperatureData ?? [];
  const mergedMap = new Map<number, Record<string, any>>();

  for (const r of rainfall) {
    if (r && typeof r.year === 'number') {
      mergedMap.set(r.year, { ...r });
    }
  }

  for (const t of temperature) {
    if (t && typeof t.year === 'number') {
      const existing = mergedMap.get(t.year) ?? { year: t.year };
      mergedMap.set(t.year, { ...existing, ...t });
    }
  }

  const sortedYears = Array.from(mergedMap.keys()).sort((a, b) => a - b);
  const rows: IStationData[] = [];

  for (const year of sortedYears) {
    const el = mergedMap.get(year)!;
    const { max_tmax, max_tmin, min_tmax, min_tmin, mean_tmax, mean_tmin } = el;
    const { end_season_doy, season_length, seasonal_rain, start_rains_doy, end_rains_doy } = el;

    let endVal: number | undefined = undefined;
    if (typeof end_rains_doy === 'number') endVal = end_rains_doy;
    if (typeof end_season_doy === 'number') endVal = end_season_doy;

    let rainVal: number | undefined = undefined;
    if (typeof seasonal_rain === 'number') {
      rainVal = seasonal_rain === 0 ? undefined : seasonal_rain;
    }

    const row: IStationData = {
      Year: year,
      Start: typeof start_rains_doy === 'number' && start_rains_doy !== 0 ? start_rains_doy : (undefined as any),
      End: typeof endVal === 'number' && endVal !== 0 ? endVal : (undefined as any),
      Length: typeof season_length === 'number' && season_length !== 0 ? season_length : (undefined as any),
      Rainfall: rainVal as any,
      Extreme_events: undefined as any,
      min_tmin: (roundClimateValue(min_tmin) ?? undefined) as any,
      mean_tmin: (roundClimateValue(mean_tmin) ?? undefined) as any,
      max_tmin: (roundClimateValue(max_tmin) ?? undefined) as any,
      min_tmax: (roundClimateValue(min_tmax) ?? undefined) as any,
      mean_tmax: (roundClimateValue(mean_tmax) ?? undefined) as any,
      max_tmax: (roundClimateValue(max_tmax) ?? undefined) as any,
    };

    rows.push(row);
  }

  return rows;
}

/**
 * Check if annual station records have any temperature observations.
 */
export function stationHasAnnualTemperature(data: IStationData[]): boolean {
  return data.some(
    (row) =>
      (row.min_tmin !== undefined && row.min_tmin !== null) ||
      (row.mean_tmin !== undefined && row.mean_tmin !== null) ||
      (row.max_tmin !== undefined && row.max_tmin !== null) ||
      (row.min_tmax !== undefined && row.min_tmax !== null) ||
      (row.mean_tmax !== undefined && row.mean_tmax !== null) ||
      (row.max_tmax !== undefined && row.max_tmax !== null),
  );
}

/**
 * Format annual station records into standard CSV text.
 * Omits temperature and extreme event columns if station is rain-only to keep bundle sizes compact.
 */
export function formatAnnualCsv(data: IStationData[], includeTemperature?: boolean): string {
  const hasTemp = includeTemperature ?? stationHasAnnualTemperature(data);

  if (!hasTemp) {
    let csv = 'Year,Start,End,Length,Rainfall\n';
    for (const row of data) {
      const year = row.Year ?? '';
      const start = row.Start !== undefined && row.Start !== null ? row.Start : '';
      const end = row.End !== undefined && row.End !== null ? row.End : '';
      const len = row.Length !== undefined && row.Length !== null ? row.Length : '';
      const rain = row.Rainfall !== undefined && row.Rainfall !== null ? row.Rainfall : '';
      csv += `${year},${start},${end},${len},${rain}\n`;
    }
    return csv;
  }

  let csv = 'Year,Start,End,Length,Rainfall,max_tmax,max_tmin,min_tmax,min_tmin,mean_tmax,mean_tmin,Extreme_events\n';
  for (const row of data) {
    const year = row.Year ?? '';
    const start = row.Start !== undefined && row.Start !== null ? row.Start : '';
    const end = row.End !== undefined && row.End !== null ? row.End : '';
    const len = row.Length !== undefined && row.Length !== null ? row.Length : '';
    const rain = row.Rainfall !== undefined && row.Rainfall !== null ? row.Rainfall : '';
    const maxTmax = row.max_tmax !== undefined && row.max_tmax !== null ? row.max_tmax : '';
    const maxTmin = row.max_tmin !== undefined && row.max_tmin !== null ? row.max_tmin : '';
    const minTmax = row.min_tmax !== undefined && row.min_tmax !== null ? row.min_tmax : '';
    const minTmin = row.min_tmin !== undefined && row.min_tmin !== null ? row.min_tmin : '';
    const meanTmax = row.mean_tmax !== undefined && row.mean_tmax !== null ? row.mean_tmax : '';
    const meanTmin = row.mean_tmin !== undefined && row.mean_tmin !== null ? row.mean_tmin : '';
    const extremes = row.Extreme_events !== undefined && row.Extreme_events !== null ? row.Extreme_events : '';
    csv += `${year},${start},${end},${len},${rain},${maxTmax},${maxTmin},${minTmax},${minTmin},${meanTmax},${meanTmin},${extremes}\n`;
  }
  return csv;
}

/*************************************************************************
 *             Selective Product Synchronization & Merging
 ************************************************************************/

export type ClimateProductId = 'rainfall' | 'start' | 'end' | 'length' | 'temp_min' | 'temp_max' | 'extremes';

export const CLIMATE_PRODUCT_GROUPS: Record<'temperature' | 'seasonal', ClimateProductId[]> = {
  temperature: ['temp_min', 'temp_max'],
  seasonal: ['rainfall', 'start', 'end', 'length', 'extremes'],
};

export const ALL_CLIMATE_PRODUCTS: ClimateProductId[] = [
  'rainfall',
  'start',
  'end',
  'length',
  'temp_min',
  'temp_max',
  'extremes',
];

export const PRODUCT_ANNUAL_FIELDS: Record<ClimateProductId, (keyof IStationData)[]> = {
  rainfall: ['Rainfall'],
  start: ['Start'],
  end: ['End'],
  length: ['Length'],
  extremes: ['Extreme_events'],
  temp_min: ['min_tmin', 'mean_tmin', 'max_tmin'],
  temp_max: ['min_tmax', 'mean_tmax', 'max_tmax'],
};

export const PRODUCT_MONTHLY_FIELDS: Record<
  Extract<ClimateProductId, 'rainfall' | 'temp_min' | 'temp_max'>,
  (keyof Omit<IMonthlyStationData, 'month'>)[]
> = {
  rainfall: ['Rainfall'],
  temp_min: ['min_tmin', 'mean_tmin', 'max_tmin'],
  temp_max: ['min_tmax', 'mean_tmax', 'max_tmax'],
};

/**
 * Resolve a product filter string or array (e.g. 'temperature', 'seasonal', 'temp_min,temp_max')
 * into a Set of validated ClimateProductId.
 * If filter is omitted, undefined, or empty, returns all climate products.
 */
export function resolveClimateProducts(filter?: string | string[]): Set<ClimateProductId> {
  if (!filter || (Array.isArray(filter) && filter.length === 0)) {
    return new Set(ALL_CLIMATE_PRODUCTS);
  }

  const tokens = Array.isArray(filter) ? filter.flatMap((f) => f.split(',')) : filter.split(',');
  const result = new Set<ClimateProductId>();

  for (const rawToken of tokens) {
    const token = rawToken.trim().toLowerCase();
    if (!token) continue;

    if (token in CLIMATE_PRODUCT_GROUPS) {
      for (const prod of CLIMATE_PRODUCT_GROUPS[token as keyof typeof CLIMATE_PRODUCT_GROUPS]) {
        result.add(prod);
      }
      continue;
    }

    if (token === 'extreme_rainfall_days' || token === 'extremes') {
      result.add('extremes');
      continue;
    }

    if (ALL_CLIMATE_PRODUCTS.includes(token as ClimateProductId)) {
      result.add(token as ClimateProductId);
      continue;
    }

    throw new Error(
      `Unknown climate product or group '${token}'. Valid groups are 'temperature', 'seasonal'. Valid products are: ${ALL_CLIMATE_PRODUCTS.join(', ')}.`,
    );
  }

  return result.size > 0 ? result : new Set(ALL_CLIMATE_PRODUCTS);
}

export type ClimateApiSummaryAction =
  | 'rainfall-summaries'
  | 'annual-temperature'
  | 'monthly-temperatures'
  | 'crop-probabilities';

/**
 * Maps a set of target ClimateProductId to corresponding dashboard/climate Edge Function actions.
 */
export function resolveClimateApiActions(products: Set<ClimateProductId>): ClimateApiSummaryAction[] {
  const actions: ClimateApiSummaryAction[] = [];
  const seasonProducts: ClimateProductId[] = ['rainfall', 'start', 'end', 'length', 'extremes'];
  if (seasonProducts.some((p) => products.has(p))) {
    actions.push('rainfall-summaries');
    actions.push('crop-probabilities');
  }
  if (products.has('temp_min') || products.has('temp_max')) {
    actions.push('annual-temperature');
    actions.push('monthly-temperatures');
  }
  return actions;
}

/**
 * Merge incoming annual station records into existing annual records, selectively updating
 * only the fields belonging to selectedProducts while strictly preserving unselected metrics.
 */
export function mergeStationAnnualData(
  existingRows: IStationData[],
  incomingRows: (Partial<IStationData> & { Year: number })[],
  selectedProducts: Set<ClimateProductId>,
): IStationData[] {
  const fieldsToUpdate = new Set<keyof IStationData>();
  for (const prod of selectedProducts) {
    const fields = PRODUCT_ANNUAL_FIELDS[prod];
    if (fields) {
      for (const f of fields) {
        fieldsToUpdate.add(f);
      }
    }
  }

  if (fieldsToUpdate.size === 0) {
    return [...existingRows].sort((a, b) => a.Year - b.Year);
  }

  const incomingMap = new Map<number, Partial<IStationData> & { Year: number }>();
  for (const row of incomingRows) {
    if (typeof row.Year === 'number' && !Number.isNaN(row.Year)) {
      incomingMap.set(row.Year, row);
    }
  }

  const processedYears = new Set<number>();
  const mergedRows: IStationData[] = [];

  for (const existing of existingRows) {
    const year = existing.Year;
    processedYears.add(year);
    const incoming = incomingMap.get(year);
    const updated: Record<string, any> = { ...existing };

    for (const field of fieldsToUpdate) {
      updated[field] = incoming && incoming[field] !== undefined ? incoming[field] : undefined;
    }

    mergedRows.push(updated as IStationData);
  }

  // Add any years present only in incomingRows
  for (const [year, incoming] of incomingMap.entries()) {
    if (!processedYears.has(year)) {
      const newRow: Record<string, any> = { Year: year };
      for (const field of fieldsToUpdate) {
        newRow[field] = incoming[field] !== undefined ? incoming[field] : undefined;
      }
      mergedRows.push(newRow as IStationData);
    }
  }

  return mergedRows.sort((a, b) => a.Year - b.Year);
}

/**
 * Merge incoming monthly station records into existing monthly records, selectively updating
 * only the fields belonging to selectedProducts while strictly preserving unselected metrics.
 */
export function mergeStationMonthlyData(
  existingRows: IMonthlyStationData[],
  incomingRows: IMonthlyStationData[],
  selectedProducts: Set<ClimateProductId>,
): IMonthlyStationData[] {
  const monthlyFieldsToUpdate = new Set<keyof Omit<IMonthlyStationData, 'month'>>();
  for (const prod of selectedProducts) {
    if (prod === 'rainfall' || prod === 'temp_min' || prod === 'temp_max') {
      const fields = PRODUCT_MONTHLY_FIELDS[prod];
      for (const f of fields) {
        monthlyFieldsToUpdate.add(f);
      }
    }
  }

  if (monthlyFieldsToUpdate.size === 0) {
    return [...existingRows].sort((a, b) => a.month.localeCompare(b.month));
  }

  const incomingMap = new Map<string, IMonthlyStationData>();
  for (const row of incomingRows) {
    if (row.month) {
      incomingMap.set(row.month, row);
    }
  }

  const processedMonths = new Set<string>();
  const mergedRows: IMonthlyStationData[] = [];

  for (const existing of existingRows) {
    const month = existing.month;
    processedMonths.add(month);
    const incoming = incomingMap.get(month);
    const updated: Record<string, any> = { ...existing };

    for (const field of monthlyFieldsToUpdate) {
      updated[field] = incoming && incoming[field] !== undefined ? incoming[field] : null;
    }

    mergedRows.push(updated as IMonthlyStationData);
  }

  // Add any months present only in incomingRows
  for (const [month, incoming] of incomingMap.entries()) {
    if (!processedMonths.has(month)) {
      const newRow: Record<string, any> = { month };
      for (const field of monthlyFieldsToUpdate) {
        newRow[field] = incoming[field] !== undefined ? incoming[field] : null;
      }
      mergedRows.push(newRow as IMonthlyStationData);
    }
  }

  return mergedRows.sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Convert database monthly temperature summary records into typed IMonthlyStationData rows.
 * Handles month normalization (numeric month + year, string 'YYYY-MM', or ISO date string).
 */
export function convertMonthlyTemperatureSummariesToRows(monthlyTemperatureData?: any[] | null): IMonthlyStationData[] {
  if (!monthlyTemperatureData || !Array.isArray(monthlyTemperatureData)) {
    return [];
  }

  const rows: IMonthlyStationData[] = [];

  for (const entry of monthlyTemperatureData) {
    if (!entry) continue;

    let monthStr = '';
    if (typeof entry.year === 'number' && typeof entry.month === 'number') {
      monthStr = `${entry.year}-${String(entry.month).padStart(2, '0')}`;
    } else if (typeof entry.month === 'string') {
      monthStr = normalizeMonthKey(entry.month);
    } else if (typeof entry.time_value === 'string') {
      monthStr = normalizeMonthKey(entry.time_value);
    }

    if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
      continue;
    }

    rows.push({
      month: monthStr,
      min_tmin: roundClimateValue(entry.min_tmin),
      mean_tmin: roundClimateValue(entry.mean_tmin),
      max_tmin: roundClimateValue(entry.max_tmin),
      min_tmax: roundClimateValue(entry.min_tmax),
      mean_tmax: roundClimateValue(entry.mean_tmax),
      max_tmax: roundClimateValue(entry.max_tmax),
    });
  }

  return rows.sort((a, b) => a.month.localeCompare(b.month));
}
