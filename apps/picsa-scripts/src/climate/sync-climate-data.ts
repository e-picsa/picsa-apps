import { execSync } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type {
  IClimateAuditReport,
  IIncomingClimateRecord,
  IMonthlyStationData,
  IStationCapabilities,
  IStationData,
} from '@picsa/models';
import {
  auditMonthlyChanges,
  calculateStationCapabilities,
  type ClimateProductId,
  convertMonthlyTemperatureSummariesToRows,
  convertStationSummariesToRows,
  formatAnnualCsv,
  formatMonthlyCsv,
  generateMarkdownAuditReport,
  mergeStationAnnualData,
  mergeStationMonthlyData,
  parseAnnualCsv,
  parseMonthlyCsv,
  pivotLongToWideMonthly,
  resolveClimateApiActions,
  resolveClimateProducts,
} from '@picsa/utils';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const ROOT_DIR = path.resolve(__dirname, '../../../../');
const CLIMATE_TOOL_ASSETS = path.join(ROOT_DIR, 'apps/picsa-tools/climate-tool/src/assets/summaries');
const DEFAULT_FIXTURE_PATH = path.join(__dirname, 'fixtures/sample-long-data.json');
const DEFAULT_REPORT_PATH = path.join(ROOT_DIR, 'dist/climate-sync-report.md');
const SUPPORTED_COUNTRIES = ['mw', 'zm', 'zw'];

export interface CliArgs {
  country?: string;
  station?: string;
  input?: string;
  auditOnly?: boolean;
  computeExisting?: boolean;
  skipPull?: boolean;
  local?: boolean;
  env?: string;
  report?: string;
  only?: string;
  refreshApi?: boolean;
}

const BOOLEAN_FLAGS: Record<string, (result: CliArgs) => void> = {
  '--audit-only': (res) => {
    res.auditOnly = true;
  },
  '--compute-existing': (res) => {
    res.computeExisting = true;
  },
  '--no-pull': (res) => {
    res.skipPull = true;
  },
  '--skip-pull': (res) => {
    res.skipPull = true;
  },
  '--pull': (res) => {
    res.skipPull = false;
  },
  '--local': (res) => {
    res.local = true;
  },
  '--refresh-api': (res) => {
    res.refreshApi = true;
  },
  '--sync-upstream': (res) => {
    res.refreshApi = true;
  },
};

const VALUED_OPTIONS: Record<string, (res: CliArgs, val: string) => void> = {
  env: (res, val) => {
    res.env = val;
  },
  country: (res, val) => {
    res.country = val.toLowerCase();
  },
  station: (res, val) => {
    res.station = val.toLowerCase();
  },
  input: (res, val) => {
    res.input = path.resolve(process.cwd(), val);
  },
  report: (res, val) => {
    res.report = path.resolve(process.cwd(), val);
  },
  only: (res, val) => {
    res.only = val.toLowerCase();
  },
  'refresh-api': (res, val) => {
    res.refreshApi = val !== 'false' && val !== '0';
  },
  'sync-upstream': (res, val) => {
    res.refreshApi = val !== 'false' && val !== '0';
  },
};

export function parseCliArgs(argv = process.argv.slice(2)): CliArgs {
  const result: CliArgs = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    const booleanHandler = BOOLEAN_FLAGS[arg];
    if (booleanHandler) {
      booleanHandler(result);
      continue;
    }

    if (!arg.startsWith('--')) {
      continue;
    }

    const eqIndex = arg.indexOf('=');
    const key = eqIndex !== -1 ? arg.slice(2, eqIndex) : arg.slice(2);
    const handler = VALUED_OPTIONS[key];
    if (!handler) {
      continue;
    }

    if (eqIndex !== -1) {
      handler(result, arg.slice(eqIndex + 1));
    } else {
      const nextArg = argv[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        handler(result, nextArg);
        i++;
      }
    }
  }

  return result;
}

export function getCountryCapsPath(country: string): string {
  return path.join(
    ROOT_DIR,
    `apps/picsa-tools/climate-tool/src/app/data/stations/${country.toLowerCase()}/capabilities.generated.ts`,
  );
}

export function loadCountryCapabilities(country: string): Record<string, IStationCapabilities> {
  const capsPath = getCountryCapsPath(country);
  if (!fs.existsSync(capsPath)) {
    return {};
  }
  // 1. Try loading via require (works natively when executed via tsx)
  try {
    delete require.cache[require.resolve(capsPath)];
    const mod = require(capsPath);
    const key = `${country.toUpperCase()}_STATION_CAPABILITIES`;
    if (mod[key]) {
      return mod[key];
    }
  } catch {
    // Fall back to safe static string parsing if require fails
  }
  // 2. Safe static JSON extraction (handles unquoted keys, single quotes, trailing commas without eval)
  try {
    const content = fs.readFileSync(capsPath, 'utf-8');
    const match = content.match(/=\s*(\{[\s\S]*?\});?\s*$/);
    if (match) {
      const jsonText = match[1]
        .replace(/'/g, '"')
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(jsonText);
    }
  } catch {
    return {};
  }
  return {};
}

export function writeCountryCapabilities(country: string, caps: Record<string, IStationCapabilities>): void {
  const capsPath = getCountryCapsPath(country);
  const countryUpper = country.toUpperCase();
  const dir = path.dirname(capsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Sort station keys alphabetically for deterministic output
  const sortedCaps: Record<string, IStationCapabilities> = {};
  for (const key of Object.keys(caps).sort((a, b) => a.localeCompare(b))) {
    sortedCaps[key] = caps[key];
  }

  const content = `import type { IStationCapabilities } from '@picsa/models';

/**
 * Automatically generated station capabilities and data availability descriptors for ${countryUpper}.
 * Generated by apps/picsa-scripts/src/climate/sync-climate-data.ts.
 * Do NOT edit manually.
 */
export const ${countryUpper}_STATION_CAPABILITIES: Record<string, IStationCapabilities> = ${JSON.stringify(
    sortedCaps,
    null,
    2,
  )};
`;
  if (fs.existsSync(capsPath) && fs.readFileSync(capsPath, 'utf-8') === content) {
    return;
  }
  fs.writeFileSync(capsPath, content, 'utf-8');
  console.log(`  ✅ Updated ${countryUpper} capabilities: ${capsPath} (${Object.keys(sortedCaps).length} stations)`);
}

export function computeSha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Query Git for the date (YYYY-MM-DD) when a station's data files were last committed.
 * Checks both annual and monthly CSV paths (if present) and returns the latest commit date.
 * Falls back to current date (YYYY-MM-DD) if uncommitted, untracked, or if git command fails.
 */
export function getStationGitLastUpdatedDate(filePaths: string[]): string {
  const existingPaths = filePaths.filter((p) => fs.existsSync(p));
  if (existingPaths.length === 0) {
    return new Date().toISOString().slice(0, 10);
  }
  try {
    const quotedPaths = existingPaths.map((p) => `"${p}"`).join(' ');
    const stdout = execSync(`git log -1 --format="%as" -- ${quotedPaths}`, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    if (stdout && /^\d{4}-\d{2}-\d{2}$/.test(stdout)) {
      return stdout;
    }
  } catch {
    // Ignore git error and fall back
  }
  return new Date().toISOString().slice(0, 10);
}

/**
 * Load station IDs registered in static country metadata (metadata.ts).
 */
export function loadRegisteredMetadataIds(country: string): Set<string> {
  const metaPath = path.join(
    ROOT_DIR,
    `apps/picsa-tools/climate-tool/src/app/data/stations/${country.toLowerCase()}/metadata.ts`,
  );
  const ids = new Set<string>();
  if (fs.existsSync(metaPath)) {
    try {
      const metaContent = fs.readFileSync(metaPath, 'utf-8');
      const idMatches = metaContent.matchAll(/id:\s*['"]([^'"]+)['"]/g);
      for (const m of idMatches) {
        ids.add(m[1].toLowerCase());
      }
    } catch {
      // Ignore if metadata extraction fails
    }
  }
  return ids;
}

/**
 * Calculate differences in capability metrics compared to previously stored capabilities.
 */
export function calculateCapabilityDiffs(
  capabilities: IStationCapabilities,
  prevCap?: IStationCapabilities,
): {
  diffTotalYears?: number;
  diffCompleteRainYears?: number;
  diffCompleteTempYears?: number;
} {
  const prevTotalYears =
    prevCap?.totalYears ??
    (prevCap?.years && prevCap.years.length === 2 ? prevCap.years[1] - prevCap.years[0] + 1 : undefined);

  return {
    diffTotalYears:
      capabilities.totalYears !== undefined && prevTotalYears !== undefined
        ? capabilities.totalYears - prevTotalYears
        : undefined,
    diffCompleteRainYears:
      capabilities.completeRainYears !== undefined && prevCap?.completeRainYears !== undefined
        ? capabilities.completeRainYears - prevCap.completeRainYears
        : undefined,
    diffCompleteTempYears:
      capabilities.completeTempYears !== undefined && prevCap?.completeTempYears !== undefined
        ? capabilities.completeTempYears - prevCap.completeTempYears
        : undefined,
  };
}

/**
 * Generate and write the markdown audit report to the target path.
 */
export function saveAuditReport(reportPath: string, auditReport: IClimateAuditReport): void {
  const reportMd = generateMarkdownAuditReport(auditReport);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, reportMd, 'utf-8');
  console.log(`\n  📄 Audit report written: ${reportPath}`);
}

/**
 * Initialize a Supabase client targeting remote server (default) or local dev container (--local).
 */
export function getSyncSupabaseClient(options: { local?: boolean; env?: string } = {}): SupabaseClient {
  const dotenv = require('dotenv');

  if (options.env) {
    const envPath = path.resolve(process.cwd(), options.env);
    if (!fs.existsSync(envPath)) {
      throw new Error(`Specified env file does not exist: ${envPath}`);
    }
    dotenv.config({ path: envPath, override: true });
  } else if (options.local) {
    const localEnvPath = path.join(ROOT_DIR, 'apps/picsa-server/.env');
    if (fs.existsSync(localEnvPath)) {
      dotenv.config({ path: localEnvPath, override: true });
    }
  } else {
    // Default: Remote server
    const serverEnvPath = path.join(ROOT_DIR, 'apps/picsa-server/.env.server');
    const localOverridePath = path.join(ROOT_DIR, 'apps/picsa-server/.env.local');
    if (fs.existsSync(serverEnvPath)) {
      dotenv.config({ path: serverEnvPath, override: true });
    }
    if (fs.existsSync(localOverridePath)) {
      dotenv.config({ path: localOverridePath, override: false });
    }
  }

  let url: string | undefined;
  if (options.local) {
    url = process.env.SUPABASE_URL || 'http://localhost:54321';
  } else {
    const projectIdUrl = process.env.SUPABASE_PROJECT_ID
      ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
      : undefined;
    url = process.env.SUPABASE_REMOTE_URL || process.env.SUPABASE_URL || projectIdUrl;
  }

  const key = options.local
    ? process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    : process.env.SUPABASE_REMOTE_SECRET_KEY ||
      process.env.SUPABASE_REMOTE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_REMOTE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_REMOTE_ANON_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    const targetDesc = options.local ? 'local Supabase container' : 'remote Supabase project';
    const configHint = options.local
      ? 'Ensure apps/picsa-server/.env exists with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
      : 'Ensure apps/picsa-server/.env.server exists with SUPABASE_REMOTE_URL and SUPABASE_REMOTE_SECRET_KEY, or pass --local to target the local dev container.';
    throw new Error(`Missing Supabase credentials for ${targetDesc}.\n${configHint}`);
  }

  console.log(`\n  🔌 Connected to Supabase (${options.local ? 'LOCAL' : 'REMOTE'}): ${url}`);
  return createClient(url, key);
}

/**
 * Refresh upstream Climate API data into Supabase database (climate_station_data)
 * by invoking the dashboard/climate edge functions for each station in a country.
 */
export async function refreshUpstreamDataForCountry(
  country: string,
  client: SupabaseClient,
  options: {
    station?: string;
    only?: string;
  } = {},
): Promise<{ totalStations: number; successfulRequests: number; failedRequests: number }> {
  const countryUpper = country.toUpperCase();
  const countryLower = country.toLowerCase();

  const targetProducts = resolveClimateProducts(options.only);
  const actions = resolveClimateApiActions(targetProducts);

  if (actions.length === 0) {
    console.log(`  No upstream API actions required for product filter '${options.only}'.`);
    return { totalStations: 0, successfulRequests: 0, failedRequests: 0 };
  }

  console.log(`\nRefreshing upstream Climate API data for ${countryUpper}...`);
  console.log(`  Target Actions: ${actions.join(', ')}`);

  let query = client
    .from('climate_stations')
    .select('id, station_id, station_name, country_code')
    .eq('country_code', countryLower);

  if (options.station) {
    query = query.eq('station_id', options.station);
  }

  const { data: stations, error: stationsErr } = await query;
  if (stationsErr) {
    throw new Error(`Failed to fetch climate_stations for ${countryUpper}: ${stationsErr.message}`);
  }

  if (!stations || stations.length === 0) {
    console.warn(`  ⚠️ No climate_stations found in database for ${countryUpper}`);
    return { totalStations: 0, successfulRequests: 0, failedRequests: 0 };
  }

  console.log(`  Found ${stations.length} station(s) to refresh from Climate API`);

  let successfulRequests = 0;
  let failedRequests = 0;

  for (let i = 0; i < stations.length; i++) {
    const s = stations[i];
    const stationSlug = s.station_id;
    const metStationName = s.station_name || stationSlug;

    for (const action of actions) {
      try {
        const { error: invokeErr } = await client.functions.invoke(`dashboard/climate/${action}`, {
          body: {
            station: {
              id: s.id,
              country_code: s.country_code,
              station_name: metStationName,
            },
            country_code: s.country_code,
          },
        });

        if (invokeErr) {
          console.warn(
            `    ⚠️ [${i + 1}/${stations.length}] ${stationSlug} (${action}) API error: ${invokeErr.message}`,
          );
          failedRequests++;
        } else {
          successfulRequests++;
        }
      } catch (err) {
        console.warn(
          `    ⚠️ [${i + 1}/${stations.length}] ${stationSlug} (${action}) invocation failed: ${err?.message || err}`,
        );
        failedRequests++;
      }
    }
  }

  console.log(
    `  Completed upstream Climate API refresh for ${countryUpper}: ${successfulRequests} successful, ${failedRequests} failed.`,
  );

  return { totalStations: stations.length, successfulRequests, failedRequests };
}

/**
 * Synchronize station summaries from Supabase database to local app assets and capabilities.
 */
export async function syncFromDatabaseForCountry(
  country: string,
  client: SupabaseClient,
  options: {
    auditReport: IClimateAuditReport;
    auditOnly?: boolean;
    station?: string;
    only?: string;
  },
): Promise<Record<string, IStationCapabilities>> {
  const countryUpper = country.toUpperCase();
  const countryLower = country.toLowerCase();
  const countryDir = path.join(CLIMATE_TOOL_ASSETS, countryLower);

  const targetProducts = resolveClimateProducts(options.only);
  const isTemperatureTargeted = targetProducts.has('temp_min') || targetProducts.has('temp_max');
  const isOnlyTemperature =
    targetProducts.size <= 2 && Array.from(targetProducts).every((p) => p === 'temp_min' || p === 'temp_max');

  console.log(`\nProcessing database stations for ${countryUpper}...`);
  if (options.only) {
    console.log(`  Target Products (--only): ${Array.from(targetProducts).join(', ')}`);
  }

  // 1. Fetch stations for country to map station.id -> station.station_id (slug)
  const { data: stations, error: stationsErr } = await client
    .from('climate_stations')
    .select('id, station_id, station_name')
    .eq('country_code', countryLower);

  if (stationsErr) {
    throw new Error(`Failed to fetch climate_stations for ${countryUpper}: ${stationsErr.message}`);
  }

  const stationMap = new Map<string, { slug: string; name: string }>();
  for (const s of stations || []) {
    stationMap.set(s.id, { slug: s.station_id, name: s.station_name });
  }

  // 2. Fetch station data summaries
  const { data: dataRows, error: dataErr } = await client
    .from('climate_station_data')
    .select('*')
    .eq('country_code', countryLower);

  if (dataErr) {
    throw new Error(`Failed to fetch climate_station_data for ${countryUpper}: ${dataErr.message}`);
  }

  if (!dataRows || dataRows.length === 0) {
    const msg = `No climate_station_data rows found in database for ${countryUpper}`;
    console.warn(`  ⚠️ ${msg}`);
    options.auditReport.warnings = options.auditReport.warnings || [];
    options.auditReport.warnings.push({
      message: 'No climate_station_data rows found in database',
      country: countryUpper,
    });
    return {};
  }

  console.log(`  Found ${dataRows.length} station records in database for ${countryUpper}`);

  const existingCaps = loadCountryCapabilities(countryLower);
  const updatedCaps: Record<string, IStationCapabilities> = { ...existingCaps };
  const registeredMetaIds = loadRegisteredMetadataIds(countryLower);

  let newCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;

  for (const row of dataRows) {
    const stationInfo = stationMap.get(row.station_id);
    const stationSlug = (stationInfo?.slug || row.station_id.replace(`${countryLower}/`, '')).toLowerCase();

    if (options.station && stationSlug !== options.station) {
      continue;
    }

    const hasAnnualTemp = Array.isArray(row.annual_temperature_data) && row.annual_temperature_data.length > 0;
    const hasMonthlyTemp = Array.isArray(row.monthly_temperature_data) && row.monthly_temperature_data.length > 0;

    // Strict requirement: Breaking warning if annual temperature is targeted/present but monthly temperature is missing
    if (isTemperatureTargeted && hasAnnualTemp && !hasMonthlyTemp) {
      const warnMsg = `Missing corresponding monthly temperature data for station with annual temperature data: ${stationSlug} (${countryUpper})`;
      console.error(`  ❌ [BREAKING] ${warnMsg}`);
      options.auditReport.warnings = options.auditReport.warnings || [];
      options.auditReport.warnings.push({
        message: warnMsg,
        country: countryUpper,
        stationId: stationSlug,
      });
      options.auditReport.sanityViolations.push({
        stationId: stationSlug,
        month: 'ALL',
        rule: 'MISSING_CORRESPONDING_MONTHLY_TEMPERATURE',
        message: `Station has annual temperature data (${row.annual_temperature_data.length} records) but zero monthly temperature records in database`,
        values: {
          country: countryUpper,
          stationId: stationSlug,
          annualRecordsCount: row.annual_temperature_data.length,
        },
      });
    }

    const annualCsvPath = path.join(countryDir, `${stationSlug}.csv`);
    const monthlyCsvPath = path.join(countryDir, `${stationSlug}.monthly.csv`);

    // If targeted strictly to temperature but station has zero temperature records in DB, preserve existing and skip
    if (isOnlyTemperature && !hasAnnualTemp && !hasMonthlyTemp) {
      if (existingCaps[stationSlug]) {
        updatedCaps[stationSlug] = existingCaps[stationSlug];
      }
      unchangedCount++;
      continue;
    }

    // 1. Annual Data Processing
    let existingAnnualData: IStationData[] = [];
    if (fs.existsSync(annualCsvPath)) {
      existingAnnualData = parseAnnualCsv(fs.readFileSync(annualCsvPath, 'utf-8'));
    }

    const candidateAnnualData = convertStationSummariesToRows(row.annual_rainfall_data, row.annual_temperature_data);
    const annualData = mergeStationAnnualData(existingAnnualData, candidateAnnualData, targetProducts);

    if (annualData.length === 0) {
      options.auditReport.warnings = options.auditReport.warnings || [];
      options.auditReport.warnings.push({
        message: 'Station has database record but zero annual data entries',
        country: countryUpper,
        stationId: stationSlug,
      });
      continue;
    }

    const annualCsvContent = formatAnnualCsv(annualData);

    // 2. Monthly Data Processing
    let monthlyData: IMonthlyStationData[] = [];
    let existingMonthlyCsvContent = '';
    if (fs.existsSync(monthlyCsvPath)) {
      existingMonthlyCsvContent = fs.readFileSync(monthlyCsvPath, 'utf-8');
      monthlyData = parseMonthlyCsv(existingMonthlyCsvContent);
    }

    let newMonthlyCsvContent = existingMonthlyCsvContent;
    if (isTemperatureTargeted && hasMonthlyTemp) {
      const incomingMonthly = convertMonthlyTemperatureSummariesToRows(row.monthly_temperature_data);
      const monthlyTemperatureProducts = new Set<ClimateProductId>(
        Array.from(targetProducts).filter(
          (product): product is ClimateProductId => product === 'temp_min' || product === 'temp_max',
        ),
      );
      monthlyData = mergeStationMonthlyData(monthlyData, incomingMonthly, monthlyTemperatureProducts);
      newMonthlyCsvContent = formatMonthlyCsv(monthlyData);
    }

    const contentHash = computeSha256(annualCsvContent.trim());
    const prevCap = existingCaps[stationSlug];
    const isAnnualUnchanged = prevCap?.contentHash === contentHash;
    const isMonthlyUnchanged = newMonthlyCsvContent.trim() === existingMonthlyCsvContent.trim();
    const isUnchanged = isAnnualUnchanged && isMonthlyUnchanged;

    // Use DB updated_at directly, formatted as YYYY-MM-DD
    const stationLastUpdated = row.updated_at
      ? row.updated_at.slice(0, 10)
      : prevCap?.lastUpdated || new Date().toISOString().slice(0, 10);

    const capabilities = calculateStationCapabilities({
      annualData,
      monthlyData,
      contentHash,
      lastUpdated: stationLastUpdated,
    });

    // Check metadata registration
    const hasMetadata = registeredMetaIds.has(stationSlug);
    if (!hasMetadata) {
      options.auditReport.warnings = options.auditReport.warnings || [];
      options.auditReport.warnings.push({
        message: 'Station has DB data but no entry in metadata.ts (unmapped station)',
        country: countryUpper,
        stationId: stationSlug,
      });
      updatedCaps[stationSlug] = {
        warning: 'No metadata available',
      } as any;
    } else {
      updatedCaps[stationSlug] = capabilities;
    }

    let status: 'NEW' | 'UPDATED' | 'UNCHANGED' = 'NEW';
    if (fs.existsSync(annualCsvPath)) {
      status = isUnchanged ? 'UNCHANGED' : 'UPDATED';
    }

    if (status === 'NEW') newCount++;
    else if (status === 'UPDATED') updatedCount++;
    else unchangedCount++;

    const { diffTotalYears, diffCompleteRainYears, diffCompleteTempYears } = calculateCapabilityDiffs(
      capabilities,
      prevCap,
    );

    options.auditReport.stationsSummary.push({
      country: countryUpper,
      id: stationSlug,
      status,
      years: capabilities.years,
      totalYears: capabilities.totalYears,
      completeRainYears: capabilities.completeRainYears,
      completeTempYears: capabilities.completeTempYears,
      diffTotalYears,
      diffCompleteRainYears,
      diffCompleteTempYears,
      annual: capabilities.annual,
      monthly: capabilities.monthly,
      hasRainfall: (capabilities.annual?.includes('rainfall') || capabilities.monthly?.includes('rainfall')) ?? false,
      hasTemperature:
        (capabilities.annual?.includes('temp_min') ||
          capabilities.annual?.includes('temp_max') ||
          capabilities.monthly?.includes('temp_min') ||
          capabilities.monthly?.includes('temp_max')) ??
        false,
      hash: contentHash,
    });
    options.auditReport.totalStationsProcessed++;

    // Only write CSV file when station data has changed or is new
    if (!options.auditOnly && status !== 'UNCHANGED') {
      if (!fs.existsSync(countryDir)) {
        fs.mkdirSync(countryDir, { recursive: true });
      }
      fs.writeFileSync(annualCsvPath, annualCsvContent, 'utf-8');
    }

    // Write monthly CSV if changed
    if (!options.auditOnly && newMonthlyCsvContent.trim() && !isMonthlyUnchanged) {
      if (!fs.existsSync(countryDir)) {
        fs.mkdirSync(countryDir, { recursive: true });
      }
      fs.writeFileSync(monthlyCsvPath, newMonthlyCsvContent, 'utf-8');
    }
  }

  console.log(
    `  ${countryUpper}: ${dataRows.length} station(s) (New: ${newCount}, Updated: ${updatedCount}, Unchanged: ${unchangedCount})`,
  );

  // Populate default capabilities (years: []) for stations registered in metadata without data files
  for (const stationId of registeredMetaIds) {
    if (!updatedCaps[stationId]) {
      updatedCaps[stationId] = {
        schemaVersion: 1,
        years: [],
      };
    }
  }

  // Prune stale capability entries that are no longer registered in metadata
  for (const key of Object.keys(updatedCaps)) {
    if (!registeredMetaIds.has(key)) {
      delete updatedCaps[key];
    }
  }

  if (!options.auditOnly) {
    writeCountryCapabilities(countryLower, updatedCaps);
  }

  return updatedCaps;
}

/**
 * Retroactively compute capabilities for all existing station CSV files in a country.
 */
export function computeExistingCapabilitiesForCountry(
  country: string,
  options: { auditReport: IClimateAuditReport; auditOnly?: boolean },
): Record<string, IStationCapabilities> {
  const countryDir = path.join(CLIMATE_TOOL_ASSETS, country);
  if (!fs.existsSync(countryDir)) {
    const msg = `Assets folder for country '${country}' does not exist: ${countryDir}`;
    console.warn(`  ⚠️ ${msg}`);
    options.auditReport.warnings = options.auditReport.warnings || [];
    options.auditReport.warnings.push({
      message: 'Assets folder does not exist for country',
      country: country.toUpperCase(),
    });
    return {};
  }

  const existingCaps = loadCountryCapabilities(country);
  const updatedCaps: Record<string, IStationCapabilities> = { ...existingCaps };

  const allFiles = fs.readdirSync(countryDir);
  const annualFiles = allFiles.filter((f) => f.endsWith('.csv') && !f.endsWith('.monthly.csv'));

  console.log(`\nProcessing existing stations for ${country.toUpperCase()} (${annualFiles.length} stations)...`);

  for (const file of annualFiles) {
    const stationId = path.basename(file, '.csv');
    const annualCsvPath = path.join(countryDir, file);
    const monthlyCsvPath = path.join(countryDir, `${stationId}.monthly.csv`);

    const annualCsvContent = fs.readFileSync(annualCsvPath, 'utf-8');
    const annualData = parseAnnualCsv(annualCsvContent);

    let monthlyData: IMonthlyStationData[] = [];
    let monthlyCsvContent = '';
    if (fs.existsSync(monthlyCsvPath)) {
      monthlyCsvContent = fs.readFileSync(monthlyCsvPath, 'utf-8');
      monthlyData = parseMonthlyCsv(monthlyCsvContent);
    }

    // Base summary metadata (contentHash, lastUpdated, years, totalYears, completeRainYears, completeTempYears) on annual data
    const contentHash = computeSha256(annualCsvContent.trim());

    const prevCap = existingCaps[stationId];
    const isUnchanged = prevCap?.contentHash === contentHash;
    const stationLastUpdated =
      isUnchanged && prevCap?.lastUpdated && /^\d{4}-\d{2}-\d{2}$/.test(prevCap.lastUpdated)
        ? prevCap.lastUpdated
        : getStationGitLastUpdatedDate([annualCsvPath]);

    const capabilities = calculateStationCapabilities({
      annualData,
      monthlyData,
      contentHash,
      lastUpdated: stationLastUpdated,
    });

    updatedCaps[stationId] = capabilities;

    const { diffTotalYears, diffCompleteRainYears, diffCompleteTempYears } = calculateCapabilityDiffs(
      capabilities,
      prevCap,
    );

    options.auditReport.stationsSummary.push({
      country: country.toUpperCase(),
      id: stationId,
      status: isUnchanged ? 'UNCHANGED' : prevCap ? 'UPDATED' : 'NEW',
      years: capabilities.years,
      totalYears: capabilities.totalYears,
      completeRainYears: capabilities.completeRainYears,
      completeTempYears: capabilities.completeTempYears,
      diffTotalYears,
      diffCompleteRainYears,
      diffCompleteTempYears,
      annual: capabilities.annual,
      monthly: capabilities.monthly,
      hasRainfall: (capabilities.annual?.includes('rainfall') || capabilities.monthly?.includes('rainfall')) ?? false,
      hasTemperature:
        (capabilities.annual?.includes('temp_min') ||
          capabilities.annual?.includes('temp_max') ||
          capabilities.monthly?.includes('temp_min') ||
          capabilities.monthly?.includes('temp_max')) ??
        false,
      hash: contentHash,
    });
    options.auditReport.totalStationsProcessed++;
  }

  // Populate default capabilities (years: []) for stations registered in metadata without data files
  const registeredMetaIds = loadRegisteredMetadataIds(country);
  for (const stationId of registeredMetaIds) {
    if (!annualFiles.includes(`${stationId}.csv`)) {
      updatedCaps[stationId] = {
        schemaVersion: 1,
        years: [],
      };
    }
  }

  // Prune stale capability entries that are no longer registered in metadata
  for (const key of Object.keys(updatedCaps)) {
    if (!registeredMetaIds.has(key)) {
      delete updatedCaps[key];
    }
  }

  if (!options.auditOnly) {
    writeCountryCapabilities(country, updatedCaps);
  }

  return updatedCaps;
}

export async function runSync(options: CliArgs = {}): Promise<IClimateAuditReport> {
  const today = new Date().toISOString().slice(0, 10);
  const auditReport: IClimateAuditReport = {
    timestamp: today,
    totalStationsProcessed: 0,
    warnings: [],
    stationsSummary: [],
    historicalRevisions: [],
    missingnessRegressions: [],
    sanityViolations: [],
  };

  const reportPath = options.report || DEFAULT_REPORT_PATH;

  const shouldPull = !options.skipPull && !options.computeExisting && !options.input;

  // 1. Pull directly from Supabase by default (Remote by default, --local for local dev container)
  if (shouldPull) {
    const client = getSyncSupabaseClient({ local: options.local, env: options.env });
    const countriesToProcess = options.country && options.country !== 'all' ? [options.country] : SUPPORTED_COUNTRIES;

    if (options.refreshApi && !options.auditOnly) {
      for (const c of countriesToProcess) {
        const result = await refreshUpstreamDataForCountry(c, client, {
          station: options.station,
          only: options.only,
        });
        if (result.failedRequests > 0) {
          throw new Error(
            `Upstream Climate API refresh failed for ${c.toUpperCase()}: ${result.failedRequests} request(s) failed.`,
          );
        }
      }
    }

    if (options.only) {
      console.log(`  Scope (--only): ${options.only}`);
    }

    for (const c of countriesToProcess) {
      await syncFromDatabaseForCountry(c, client, {
        auditReport,
        auditOnly: options.auditOnly,
        station: options.station,
        only: options.only,
      });
    }

    // Write audit report
    saveAuditReport(reportPath, auditReport);

    console.log(`\n======================================================`);
    console.log(`[Database Climate Sync Complete]`);
    console.log(`  Source: ${options.local ? 'LOCAL' : 'REMOTE'}`);
    console.log(`  Total Stations Processed: ${auditReport.totalStationsProcessed}`);
    console.log(`  Total Warnings: ${auditReport.warnings?.length || 0}`);
    console.log(`======================================================\n`);

    return auditReport;
  }

  // 2. Retroactive capabilities computation for existing local data (when --skip-pull or --compute-existing)
  if (options.computeExisting || options.skipPull) {
    const countriesToProcess = options.country && options.country !== 'all' ? [options.country] : SUPPORTED_COUNTRIES;

    for (const c of countriesToProcess) {
      computeExistingCapabilitiesForCountry(c, {
        auditReport,
        auditOnly: options.auditOnly,
      });
    }

    // Write audit report
    saveAuditReport(reportPath, auditReport);

    console.log(`\n======================================================`);
    console.log(`[Retroactive Capabilities Computation Complete]`);
    console.log(`  Total Stations Processed: ${auditReport.totalStationsProcessed}`);
    console.log(`  Total Warnings: ${auditReport.warnings?.length || 0}`);
    console.log(`======================================================\n`);

    return auditReport;
  }

  // 2. Incoming data synchronization
  const country = (options.country || 'zm').toLowerCase();
  const inputPath = options.input || DEFAULT_FIXTURE_PATH;

  console.log(`\nStarting Climate Data Sync for Country: ${country.toUpperCase()}`);
  console.log(`  Input: ${inputPath}`);
  console.log(`  Mode: ${options.auditOnly ? 'AUDIT ONLY' : 'SYNC & WRITE'}`);
  if (options.only) {
    console.log(`  Scope (--only): ${options.only}`);
  }

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file does not exist: ${inputPath}`);
  }

  const rawJson = fs.readFileSync(inputPath, 'utf-8');
  const incomingRecords: IIncomingClimateRecord[] = JSON.parse(rawJson);
  console.log(`  Loaded ${incomingRecords.length} incoming long records.`);

  // Group records by station_id
  const stationGroups = new Map<string, IIncomingClimateRecord[]>();
  for (const record of incomingRecords) {
    if (options.station && record.station_id.toLowerCase() !== options.station) {
      continue;
    }
    const list = stationGroups.get(record.station_id) || [];
    list.push(record);
    stationGroups.set(record.station_id, list);
  }

  console.log(`  Identified ${stationGroups.size} station(s) to process.`);
  auditReport.totalStationsProcessed = stationGroups.size;

  const countryDir = path.join(CLIMATE_TOOL_ASSETS, country);
  const existingCaps = loadCountryCapabilities(country);
  const updatedCaps: Record<string, IStationCapabilities> = { ...existingCaps };

  for (const [stationId, records] of stationGroups.entries()) {
    const rawMonthlyData = pivotLongToWideMonthly(records, {
      onDuplicate: (dup) => {
        if (dup.isConflict) {
          auditReport.sanityViolations.push({
            stationId,
            month: dup.month,
            rule: 'DUPLICATE_OBSERVATION_CONFLICT',
            message: `Conflicting duplicate observation for '${dup.element}' in month ${dup.month}: earlier value was ${dup.existingValue}, incoming value is ${dup.incomingValue} (overwritten with incoming)`,
            values: {
              element: dup.element,
              earlierValue: dup.existingValue,
              incomingValue: dup.incomingValue,
            },
          });
        }
      },
    });

    const monthlyCsvPath = path.join(countryDir, `${stationId}.monthly.csv`);
    const annualCsvPath = path.join(countryDir, `${stationId}.csv`);

    let previousMonthlyData: IMonthlyStationData[] = [];
    let previousMonthlyCsvContent = '';
    if (fs.existsSync(monthlyCsvPath)) {
      previousMonthlyCsvContent = fs.readFileSync(monthlyCsvPath, 'utf-8');
      previousMonthlyData = parseMonthlyCsv(previousMonthlyCsvContent);
    }

    let annualData: IStationData[] = [];
    let annualCsvContent = '';
    if (fs.existsSync(annualCsvPath)) {
      annualCsvContent = fs.readFileSync(annualCsvPath, 'utf-8');
      annualData = parseAnnualCsv(annualCsvContent);
    }

    const targetProducts = resolveClimateProducts(options.only);
    const newMonthlyData = options.only
      ? mergeStationMonthlyData(previousMonthlyData, rawMonthlyData, targetProducts)
      : rawMonthlyData;

    // Audit diffing
    const diff = auditMonthlyChanges({
      stationId,
      existingData: previousMonthlyData,
      incomingData: newMonthlyData,
    });

    auditReport.historicalRevisions.push(...diff.revisions);
    auditReport.missingnessRegressions.push(...diff.regressions);
    auditReport.sanityViolations.push(...diff.sanityViolations);

    // Format wide monthly CSV
    const newMonthlyCsvContent = formatMonthlyCsv(newMonthlyData);

    // Deterministic hash of annual + monthly data
    const combinedDataForHash = annualCsvContent
      ? `${annualCsvContent.trim()}\n---\n${newMonthlyCsvContent.trim()}`
      : newMonthlyCsvContent.trim();
    const contentHash = computeSha256(combinedDataForHash);

    // Check if station data is completely unchanged
    const prevCap = existingCaps[stationId];
    const isUnchanged =
      prevCap?.contentHash === contentHash && previousMonthlyCsvContent.trim() === newMonthlyCsvContent.trim();
    const stationLastUpdated =
      isUnchanged && prevCap?.lastUpdated && /^\d{4}-\d{2}-\d{2}$/.test(prevCap.lastUpdated)
        ? prevCap.lastUpdated
        : today;

    // Calculate station capabilities
    const capabilities = calculateStationCapabilities({
      annualData,
      monthlyData: newMonthlyData,
      contentHash,
      lastUpdated: stationLastUpdated,
    });

    updatedCaps[stationId] = capabilities;

    // Station status
    let status: 'NEW' | 'UPDATED' | 'UNCHANGED' = 'NEW';
    if (previousMonthlyCsvContent) {
      status = isUnchanged ? 'UNCHANGED' : 'UPDATED';
    }

    const { diffTotalYears, diffCompleteRainYears, diffCompleteTempYears } = calculateCapabilityDiffs(
      capabilities,
      prevCap,
    );

    auditReport.stationsSummary.push({
      country: country.toUpperCase(),
      id: stationId,
      status,
      years: capabilities.years,
      totalYears: capabilities.totalYears,
      completeRainYears: capabilities.completeRainYears,
      completeTempYears: capabilities.completeTempYears,
      diffTotalYears,
      diffCompleteRainYears,
      diffCompleteTempYears,
      annual: capabilities.annual,
      monthly: capabilities.monthly,
      hasRainfall: (capabilities.annual?.includes('rainfall') || capabilities.monthly?.includes('rainfall')) ?? false,
      hasTemperature:
        (capabilities.annual?.includes('temp_min') ||
          capabilities.annual?.includes('temp_max') ||
          capabilities.monthly?.includes('temp_min') ||
          capabilities.monthly?.includes('temp_max')) ??
        false,
      hash: contentHash,
    });

    // Write monthly file if not audit-only and station data changed
    if (!options.auditOnly && status !== 'UNCHANGED') {
      if (!fs.existsSync(countryDir)) {
        fs.mkdirSync(countryDir, { recursive: true });
      }
      fs.writeFileSync(monthlyCsvPath, newMonthlyCsvContent, 'utf-8');
    }
  }

  // Update country capabilities.generated.ts if not audit-only
  if (!options.auditOnly) {
    writeCountryCapabilities(country, updatedCaps);
  }

  // Generate and write markdown audit report
  saveAuditReport(reportPath, auditReport);

  // Print summary to terminal
  console.log(`\n======================================================`);
  console.log(`[Climate Sync Complete]`);
  console.log(`  Total Stations: ${auditReport.totalStationsProcessed}`);
  console.log(`  Total Warnings: ${auditReport.warnings?.length || 0}`);
  console.log(`  Historical Revisions: ${auditReport.historicalRevisions.length}`);
  console.log(`  Missingness Regressions: ${auditReport.missingnessRegressions.length}`);
  console.log(`  Sanity Violations: ${auditReport.sanityViolations.length}`);
  console.log(`======================================================\n`);

  return auditReport;
}

// Run CLI directly if executed
if (require.main === module) {
  const cliArgs = parseCliArgs();
  runSync(cliArgs).catch((err) => {
    console.error(`[Climate Sync Error]:`, err);
    process.exit(1);
  });
}
