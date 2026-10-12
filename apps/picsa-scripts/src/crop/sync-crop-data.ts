import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { getGeoLocationData } from '../../../../libs/data/geoLocation';
import type { ICountryCode } from '../../../../libs/data/deployments/countries';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  computeExpectedProbabilityTable,
  roundToNearest,
} from '../../../../apps/picsa-apps/dashboard/src/app/modules/crop-information/utils/probability.utils';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type {
  IAnnualRainfallSummariesData,
  ICropSuccessEntry,
} from '../../../../apps/picsa-apps/dashboard/src/app/modules/climate/types';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type {
  ICropData,
  ICropDataDownscaledWaterRequirements,
} from '../../../../apps/picsa-apps/dashboard/src/app/modules/crop-information/services';

const ROOT_DIR = path.resolve(__dirname, '../../../../');
const CROP_TOOL_DATA = path.join(ROOT_DIR, 'apps/picsa-tools/crop-probability-tool/src/app/data');
const DEFAULT_REPORT_PATH = path.join(ROOT_DIR, 'dist/crop-sync-report.md');

export interface CliArgs {
  country?: string;
  station?: string;
  auditOnly?: boolean;
  report?: string;
}

export function parseCliArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {};

  for (const arg of args) {
    if (arg === '--audit-only') {
      result.auditOnly = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith('--country=')) {
      result.country = arg.replace('--country=', '').toLowerCase();
    } else if (arg.startsWith('--station=')) {
      result.station = arg.replace('--station=', '').toLowerCase();
    } else if (arg.startsWith('--direction=')) {
      const direction = arg.replace('--direction=', '').toLowerCase();
      if (direction !== 'db-to-app') {
        throw new Error(
          `Unsupported direction '${direction}'. Only 'db-to-app' is supported: app probability tables are computed outputs and cannot be synced back into water requirement definitions.`,
        );
      }
    } else if (arg.startsWith('--report=')) {
      result.report = path.resolve(process.cwd(), arg.replace('--report=', ''));
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
Crop Data Sync (db-to-app)

Generates crop probability app tables from Supabase data, mirroring the
dashboard "Export App Data" action. Writes per-location JSON files plus an
index.ts for the requested country.

Usage:
  yarn scripts:crop:sync --country=zm [--station=<station_id>] [--audit-only] [--report=path]

Options:
  --country=<code>   Country code to sync (default: zm)
  --station=<id>     Only sync downscaled rows linked to this station_id.
                     Skips index.ts regeneration (full-country sync required).
  --audit-only       Compute and report without writing files
  --report=<path>    Audit report output path (default: dist/crop-sync-report.md)

Environment:
  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set.
`);
}

export function getCountryDir(country: string): string {
  return path.join(CROP_TOOL_DATA, country.toLowerCase());
}

export function computeSha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

export interface ICropSyncStationDetail {
  location_id: string;
  station_id: string;
  status: 'SYNCED' | 'UNCHANGED' | 'NEW' | 'SKIPPED' | 'ERROR';
  message?: string;
}

export interface ICropSyncReport {
  timestamp: string;
  country: string;
  totalRowsProcessed: number;
  stationsSynced: number;
  stationsUnchanged: number;
  stationsNew: number;
  stationsSkipped: number;
  stationsErrors: number;
  details: ICropSyncStationDetail[];
}

// Minimal row shapes for the tables read during sync (Json columns are
// narrowed to their concrete shapes at the point of use)
interface IDownscaledRow {
  location_id: string;
  station_id: string | null;
  water_requirements: ICropDataDownscaledWaterRequirements;
}
interface IStationDataRow {
  station_id: string;
  annual_rainfall_data: IAnnualRainfallSummariesData[] | null;
  crop_probability_data: ICropSuccessEntry[] | null;
}
interface IExportEntry {
  id: string;
  label: string;
  station_label: string;
  dateHeadings: string[];
  seasonProbabilities: number[];
  fileName: string;
}

/** Lookup maps shared by the per-row sync processor */
interface ISyncRowContext {
  stationDataHashmap: Map<string, IStationDataRow>;
  cropDataHashmap: Record<string, ICropData['Row']>;
  stationNameHashmap: Map<string, string>;
  locations: { id: string; label: string; admin_4?: string }[];
  countryDir: string;
  auditOnly: boolean;
}

/** Report counter keyed by row status */
const COUNTER_BY_STATUS = {
  SYNCED: 'stationsSynced',
  UNCHANGED: 'stationsUnchanged',
  NEW: 'stationsNew',
  SKIPPED: 'stationsSkipped',
  ERROR: 'stationsErrors',
} as const;

interface ISyncContext extends ISyncRowContext {
  downscaledRows: IDownscaledRow[];
}

/** Load all required tables for the country, throwing on any fetch failure */
async function fetchSyncContext(supabase: SupabaseClient, country: string, options: CliArgs): Promise<ISyncContext> {
  const [downscaledRes, stationDataRes, cropRes, stationsRes] = await Promise.all([
    supabase
      .from('crop_data_downscaled')
      .select('location_id,station_id,water_requirements')
      .eq('country_code', country),
    supabase
      .from('climate_station_data')
      .select('station_id,annual_rainfall_data,crop_probability_data')
      .eq('country_code', country),
    supabase.from('crop_data').select('*').eq('country_code', country),
    supabase.from('climate_stations').select('id,station_name').eq('country_code', country),
  ]);
  const responses = [
    ['crop_data_downscaled', downscaledRes],
    ['climate_station_data', stationDataRes],
    ['crop_data', cropRes],
    ['climate_stations', stationsRes],
  ] as const;
  for (const [label, res] of responses) {
    if (res.error) throw new Error(`Failed to fetch ${label}: ${res.error.message}`);
  }

  let downscaledRows = (downscaledRes.data ?? []) as IDownscaledRow[];
  if (options.station) {
    downscaledRows = downscaledRows.filter((row) => row.station_id?.toLowerCase() === options.station);
  }

  const stationDataHashmap = new Map<string, IStationDataRow>();
  for (const row of (stationDataRes.data ?? []) as IStationDataRow[]) {
    stationDataHashmap.set(row.station_id, row);
  }
  const cropDataHashmap: Record<string, ICropData['Row']> = {};
  for (const row of (cropRes.data ?? []) as ICropData['Row'][]) {
    cropDataHashmap[`${row.crop}/${row.variety}`] = row;
  }
  const stationNameHashmap = new Map<string, string>();
  for (const row of (stationsRes.data ?? []) as { id: string | null; station_name: string | null }[]) {
    if (row.id) stationNameHashmap.set(row.id, row.station_name ?? row.id);
  }

  const locationData = getGeoLocationData(country as ICountryCode);
  const locations = locationData.admin_5?.locations ?? locationData.admin_4?.locations ?? [];

  const countryDir = getCountryDir(country);
  if (!options.auditOnly && !fs.existsSync(countryDir)) {
    fs.mkdirSync(countryDir, { recursive: true });
  }
  const auditOnly = options.auditOnly ?? false;
  return { downscaledRows, stationDataHashmap, cropDataHashmap, stationNameHashmap, locations, countryDir, auditOnly };
}

/** Record a skipped row with the given reason */
function skippedRow(row: IDownscaledRow, message: string): ICropSyncStationDetail {
  return { location_id: row.location_id, station_id: row.station_id ?? '', status: 'SKIPPED', message };
}

/**
 * Generate the app table for a single downscaled row, writing the JSON file
 * unless running in audit-only mode. Returns the audit detail plus the index
 * entry (omitted when the file content is unchanged).
 */
function processDownscaledRow(
  row: IDownscaledRow,
  ctx: ISyncRowContext,
): { detail: ICropSyncStationDetail; exportEntry: IExportEntry | null } {
  const skipped = (message: string) => ({ detail: skippedRow(row, message), exportEntry: null });
  if (!row.station_id) return skipped('No linked station_id');

  const waterRequirements = row.water_requirements ?? {};
  if (Object.keys(waterRequirements).length === 0) return skipped('Empty water_requirements');

  const stationData = ctx.stationDataHashmap.get(row.station_id);
  // Shared pipeline with the dashboard export; null when station data is insufficient
  const expected = computeExpectedProbabilityTable({
    cropDataHashmap: ctx.cropDataHashmap,
    waterRequirements,
    rainfallData: stationData?.annual_rainfall_data ?? [],
    cropProbabilityData: stationData?.crop_probability_data ?? [],
  });
  if (!expected) return skipped('Insufficient station data to generate table');
  const { table: tableData, startProbabilities } = expected;

  // Location-based file naming matches existing app assets (<parent>--<location>.json)
  const match = ctx.locations.find((v) => v.id === row.location_id);
  const parentId = match?.admin_4 ?? '';
  const id = parentId ? `${parentId}/${row.location_id}` : row.location_id;
  const label = match?.label ?? row.location_id;
  const station_label = ctx.stationNameHashmap.get(row.station_id) ?? row.station_id;
  const fileName = parentId ? `${parentId}--${row.location_id}` : row.location_id;

  const jsonContent = JSON.stringify(tableData, null, 2);
  const contentHash = computeSha256(jsonContent);
  const filePath = path.join(ctx.countryDir, `${fileName}.json`);
  const existedBefore = fs.existsSync(filePath);
  const isUnchanged = existedBefore && computeSha256(fs.readFileSync(filePath, 'utf-8').trim()) === contentHash;

  if (isUnchanged) {
    return {
      detail: { location_id: row.location_id, station_id: row.station_id, status: 'UNCHANGED' },
      exportEntry: null,
    };
  }
  if (!ctx.auditOnly) fs.writeFileSync(filePath, jsonContent, 'utf-8');
  let verb: string;
  if (ctx.auditOnly) verb = 'Would write';
  else if (existedBefore) verb = 'Updated';
  else verb = 'Created';
  console.log(`  ${verb}: ${fileName}.json`);

  return {
    detail: {
      location_id: row.location_id,
      station_id: row.station_id,
      status: existedBefore ? 'SYNCED' : 'NEW',
    },
    exportEntry: {
      id,
      label,
      station_label,
      dateHeadings: startProbabilities.map((v) => v.label),
      seasonProbabilities: startProbabilities.map((v) => roundToNearest(v.probability, 0.1)),
      fileName,
    },
  };
}

export async function runSync(options: CliArgs = {}): Promise<ICropSyncReport> {
  const today = new Date().toISOString().slice(0, 10);
  const country = (options.country || 'zm').toLowerCase();
  const reportPath = options.report || DEFAULT_REPORT_PATH;

  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable is required');
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const auditReport: ICropSyncReport = {
    timestamp: today,
    country,
    totalRowsProcessed: 0,
    stationsSynced: 0,
    stationsUnchanged: 0,
    stationsNew: 0,
    stationsSkipped: 0,
    stationsErrors: 0,
    details: [],
  };

  console.log(`\nStarting Crop Data Sync for Country: ${country.toUpperCase()}`);
  console.log(`  Direction: db-to-app`);
  console.log(`  Mode: ${options.auditOnly ? 'AUDIT ONLY' : 'SYNC & WRITE'}`);
  if (options.station) console.log(`  Station Filter: ${options.station}`);

  const ctx = await fetchSyncContext(supabase, country, options);

  console.log(`  Identified ${ctx.downscaledRows.length} downscaled row(s) to process.`);
  auditReport.totalRowsProcessed = ctx.downscaledRows.length;

  const exportEntries: IExportEntry[] = [];

  for (const row of ctx.downscaledRows) {
    let detail: ICropSyncStationDetail;
    try {
      const result = processDownscaledRow(row, ctx);
      detail = result.detail;
      if (result.exportEntry) exportEntries.push(result.exportEntry);
    } catch (err) {
      detail = {
        location_id: row.location_id,
        station_id: row.station_id ?? '',
        status: 'ERROR',
        message: (err as Error).message,
      };
      console.error(`  Error processing ${row.location_id}:`, (err as Error).message);
    }
    auditReport.details.push(detail);
    auditReport[COUNTER_BY_STATUS[detail.status]] += 1;
  }

  // Regenerate index.ts for full-country syncs (station-filtered runs skip to avoid dropping entries)
  if (!options.auditOnly) {
    if (options.station) {
      console.log(
        `  Skipping index.ts regeneration for station-filtered sync (run a full-country sync to rebuild the index)`,
      );
    } else {
      writeCountryIndex(country, exportEntries);
    }
  }

  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportPath, generateMarkdownReport(auditReport), 'utf-8');
  console.log(`  Audit report written: ${reportPath}`);

  console.log(`\n======================================================`);
  console.log(`[Crop Sync Complete]`);
  console.log(`  Total Rows: ${auditReport.totalRowsProcessed}`);
  console.log(`  Synced: ${auditReport.stationsSynced}`);
  console.log(`  New: ${auditReport.stationsNew}`);
  console.log(`  Unchanged: ${auditReport.stationsUnchanged}`);
  console.log(`  Skipped: ${auditReport.stationsSkipped}`);
  console.log(`  Errors: ${auditReport.stationsErrors}`);
  console.log(`======================================================\n`);

  return auditReport;
}

function writeCountryIndex(country: string, exportEntries: IExportEntry[]): void {
  const variableName = `${country.toUpperCase()}_CROP_DATA`;
  const doubleToSingleQuote = (str: string) => str.replace(/"/g, "'");
  const sorted = [...exportEntries].sort((a, b) => a.id.localeCompare(b.id));

  let indexContent = `import { IProbabilityTable, IStationCropData } from '../../models';\n\n`;
  indexContent += `/**\n * Automatically generated crop probability data index for ${country.toUpperCase()}.\n * Generated by apps/picsa-scripts/src/crop/sync-crop-data.ts.\n * Do NOT edit manually.\n */\n`;
  indexContent += `const ${variableName}: IProbabilityTable[] = [\n`;
  for (const entry of sorted) {
    indexContent += `  {\n`;
    indexContent += `    id: '${entry.id}',\n`;
    indexContent += `    label: '${entry.label.replace(/'/g, "\\'")}',\n`;
    indexContent += `    station_label: '${entry.station_label.replace(/'/g, "\\'")}',\n`;
    indexContent += `    dateHeadings: ${doubleToSingleQuote(JSON.stringify(entry.dateHeadings))},\n`;
    indexContent += `    seasonProbabilities: ${doubleToSingleQuote(JSON.stringify(entry.seasonProbabilities))},\n`;
    indexContent += `    data: async () => import('./${entry.fileName}.json').then((v) => v.default as IStationCropData[]),\n`;
    indexContent += `  },\n`;
  }
  indexContent += `];\n\nexport default ${variableName};\n`;

  const indexPath = path.join(getCountryDir(country), 'index.ts');
  fs.writeFileSync(indexPath, indexContent, 'utf-8');
  console.log(`  Updated index: ${indexPath} (${sorted.length} locations)`);
}

function generateMarkdownReport(report: ICropSyncReport): string {
  const lines: string[] = [
    `# Crop Data Sync Report`,
    ``,
    `**Timestamp:** ${report.timestamp}`,
    `**Country:** ${report.country.toUpperCase()}`,
    `**Total Rows:** ${report.totalRowsProcessed}`,
    `**Synced:** ${report.stationsSynced}`,
    `**New:** ${report.stationsNew}`,
    `**Unchanged:** ${report.stationsUnchanged}`,
    `**Skipped:** ${report.stationsSkipped}`,
    `**Errors:** ${report.stationsErrors}`,
    ``,
    `## Location Details`,
    ``,
    `| Location | Station | Status | Message |`,
    `|----------|---------|--------|---------|`,
  ];

  const statusIcon = { SYNCED: '✅', UNCHANGED: '⏭️', NEW: '✨', SKIPPED: '⏭️', ERROR: '❌' } as const;
  for (const detail of report.details) {
    lines.push(
      `| ${detail.location_id} | ${detail.station_id} | ${statusIcon[detail.status]} ${detail.status} | ${detail.message ?? ''} |`,
    );
  }

  return lines.join('\n');
}

// Run CLI directly if executed
if (require.main === module) {
  const cliArgs = parseCliArgs();
  runSync(cliArgs).catch((err) => {
    console.error(`[Crop Sync Error]:`, err);
    process.exit(1);
  });
}
