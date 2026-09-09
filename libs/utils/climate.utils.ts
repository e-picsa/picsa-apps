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
} from '@picsa/models';

/**
 * Standard rounding for climate physical observations.
 * Eliminates float precision noise and ensures deterministic diffs.
 */
export function roundClimateValue(val: number | null | undefined): number | null {
  if (val === null || val === undefined || isNaN(val)) {
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

/**
 * Transform incoming long-format climate records into wide monthly station records.
 * Sorts chronologically by month ascending (YYYY-MM).
 */
export function pivotLongToWideMonthly(records: IIncomingClimateRecord[]): IMonthlyStationData[] {
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

  let csv = 'month,Rainfall,min_tmin,mean_tmin,mean_tmax,max_tmax\n';
  for (const row of data) {
    const rain = row.Rainfall !== undefined && row.Rainfall !== null ? row.Rainfall : '';
    const minTmin = row.min_tmin !== undefined && row.min_tmin !== null ? row.min_tmin : '';
    const meanTmin = row.mean_tmin !== undefined && row.mean_tmin !== null ? row.mean_tmin : '';
    const meanTmax = row.mean_tmax !== undefined && row.mean_tmax !== null ? row.mean_tmax : '';
    const maxTmax = row.max_tmax !== undefined && row.max_tmax !== null ? row.max_tmax : '';
    csv += `${row.month},${rain},${minTmin},${meanTmin},${meanTmax},${maxTmax}\n`;
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
        entry[header] = isNaN(num) ? null : roundClimateValue(num);
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
        rowObj[header] = isNaN(num) ? rawVal : num;
      } else {
        rowObj[header] = null;
      }
    }

    const yearVal = rowObj['Year'] ?? rowObj['year'];
    if (typeof yearVal !== 'number' || isNaN(yearVal)) continue;

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
    if (typeof row.Year === 'number' && !isNaN(row.Year)) {
      if (firstYear === undefined || row.Year < firstYear) firstYear = row.Year;
      if (lastYear === undefined || row.Year > lastYear) lastYear = row.Year;
    }
  }

  // Also check monthly data for year bounds
  for (const row of monthlyData) {
    const yr = parseInt(row.month.slice(0, 4), 10);
    if (!isNaN(yr)) {
      if (firstYear === undefined || yr < firstYear) firstYear = yr;
      if (lastYear === undefined || yr > lastYear) lastYear = yr;
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

  // Compute totalMissingYears
  let totalMissingYears: number | undefined;
  if (firstYear !== undefined && lastYear !== undefined) {
    const validYears = new Set<number>();

    // Check annual data valid rows
    for (const row of annualData) {
      if (typeof row.Year !== 'number' || isNaN(row.Year)) continue;
      const hasMetric =
        (typeof row.Rainfall === 'number' && !isNaN(row.Rainfall)) ||
        (typeof row.Start === 'number' && !isNaN(row.Start)) ||
        (typeof row.End === 'number' && !isNaN(row.End)) ||
        (typeof row.Length === 'number' && !isNaN(row.Length)) ||
        (typeof row.Extreme_events === 'number' && !isNaN(row.Extreme_events)) ||
        (typeof row.min_tmin === 'number' && !isNaN(row.min_tmin)) ||
        (typeof row.mean_tmin === 'number' && !isNaN(row.mean_tmin)) ||
        (typeof row.max_tmin === 'number' && !isNaN(row.max_tmin)) ||
        (typeof row.min_tmax === 'number' && !isNaN(row.min_tmax)) ||
        (typeof row.mean_tmax === 'number' && !isNaN(row.mean_tmax)) ||
        (typeof row.max_tmax === 'number' && !isNaN(row.max_tmax));

      if (hasMetric) {
        validYears.add(row.Year);
      }
    }

    // Check monthly data valid rows
    for (const row of monthlyData) {
      const yr = parseInt(row.month.slice(0, 4), 10);
      if (!isNaN(yr)) {
        const hasMetric =
          (typeof row.Rainfall === 'number' && !isNaN(row.Rainfall)) ||
          (typeof row.min_tmin === 'number' && !isNaN(row.min_tmin)) ||
          (typeof row.mean_tmin === 'number' && !isNaN(row.mean_tmin)) ||
          (typeof row.max_tmin === 'number' && !isNaN(row.max_tmin)) ||
          (typeof row.min_tmax === 'number' && !isNaN(row.min_tmax)) ||
          (typeof row.mean_tmax === 'number' && !isNaN(row.mean_tmax)) ||
          (typeof row.max_tmax === 'number' && !isNaN(row.max_tmax));
        if (hasMetric) {
          validYears.add(yr);
        }
      }
    }

    const totalYearsSpan = lastYear - firstYear + 1;
    totalMissingYears = Math.max(0, totalYearsSpan - validYears.size);
  }

  return {
    schemaVersion,
    lastUpdated: lastUpdated || new Date().toISOString(),
    contentHash,
    years: firstYear !== undefined && lastYear !== undefined ? [firstYear, lastYear] : undefined,
    totalMissingYears,
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
    const mm = parseInt(monthParts[1], 10);
    if (isNaN(mm) || mm < 1 || mm > 12) {
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
export function generateMarkdownAuditReport(report: IClimateAuditReport): string {
  const {
    timestamp,
    totalStationsProcessed,
    stationsSummary,
    historicalRevisions,
    missingnessRegressions,
    sanityViolations,
  } = report;

  let md = `# Climate Data Sync & Health Audit Report\n\n`;
  md += `**Execution Time**: \`${timestamp}\`  \n`;
  md += `**Total Stations Processed**: \`${totalStationsProcessed}\`\n\n`;

  // Stations summary table
  md += `## 1. Stations Summary\n\n`;
  md += `| Station ID | Status | Historical Range | Missing Years | Monthly Charts | Content Hash |\n`;
  md += `| :--- | :---: | :---: | :---: | :---: | :--- |\n`;

  for (const s of stationsSummary) {
    const range = s.years ? `${s.years[0]}–${s.years[1]}` : 'N/A';
    const missing = s.totalMissingYears !== undefined ? `${s.totalMissingYears}` : '0';
    const monthlyCharts = s.monthly && s.monthly.length > 0 ? s.monthly.join(', ') : '—';
    const hash = s.hash ? `\`${s.hash.slice(0, 10)}...\`` : '—';
    md += `| **${s.id}** | \`${s.status}\` | ${range} | ${missing} | ${monthlyCharts} | ${hash} |\n`;
  }

  md += `\n`;

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

  return md;
}
