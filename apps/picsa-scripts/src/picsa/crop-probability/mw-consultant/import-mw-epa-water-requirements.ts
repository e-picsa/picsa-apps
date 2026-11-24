/**
 * MW Consultant EPA Water-Requirements Import (one-off)
 *
 * Parses `input/mw-probabilities.xlsx` (28 district sheets, EPA blocks separated
 * by blank rows) into `crop_data` (variety definitions) + `crop_data_downscaled`
 * (per-EPA water requirements), with QC-bounds pre-check per EPA block.
 *
 * Usage:
 *   yarn scripts picsa/crop-probability/mw-consultant/import-mw-epa-water-requirements [--upsert|--write-epa-column]
 *
 * - no flags (one-shot): parse sheets -> intermediates/ + review/*.md + sql/*.sql (no DB writes)
 * - `--upsert`: also upsert to Supabase (local dev instance by default)
 * - `--write-epa-column`: maintainer-only backfill of the workbook's epa_canonical column
 *
 * Flags `--local`/`--remote`/`--env=<path>` select the Supabase target
 * (defaults to local when `apps/picsa-server/.env.server` is absent).
 *
 * NOTE: one-off data preparation - verify audit output carefully before `--upsert`,
 * then verify generated tables via `yarn scripts:crop:sync --country=mw --audit-only`.
 */
import { resolve } from 'path';
import { ensureDir, writeFile, writeJson } from 'fs-extra';
import { existsSync } from 'node:fs';
// eslint-disable-next-line @nx/enforce-module-boundaries
import MW_EPAS from '../../../../../../libs/data/geoLocation/mw/epas';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  computeExpectedProbabilityTable,
  // eslint-disable-next-line @nx/enforce-module-boundaries
} from '../../../../../../apps/picsa-apps/dashboard/src/app/modules/crop-information/utils/probability.utils';
import type { ICropName } from '@picsa/data';

import { parseDaysRange, parseVarietyString, roundToNearest } from '../extract-varieties/parser';
import { sanitizeCropVarietyMapping } from '../extract-varieties/cleaning-rules';
import { canonicaliseCropName } from './crop-name-mapping';
import { getEpaMapping, SHEET_TO_DISTRICT, stableBlockKey } from './epa-mapping';
import { getUnmappedVerdict } from './unmapped-verdicts';
import { haversineKm, resolveStationId, type IClimateStationRef } from './station-mapping';
import { getSyncSupabaseClient } from '../../../climate/sync-climate-data';
import type { IEpaBlock } from './block-types';

const INPUT_XLSX = resolve(__dirname, 'input', 'mw-probabilities.xlsx');
const INPUT_PATH = INPUT_XLSX;
const INTERMEDIATES_DIR = resolve(__dirname, 'intermediates');
const REVIEW_DIR = resolve(__dirname, 'review');
const SQL_DIR = resolve(__dirname, 'sql');
const COUNTRY_CODE = 'mw';
/** 1-based column of the human-verifiable `epa_canonical` mapping column */
const EPA_COLUMN = 14;

/**
 * Verified source-coordinate repairs (geo-thread point-in-polygon confirmed).
 * The xlsx Baka block has lat/lon swapped; the corrected point falls inside
 * mpata_epa. Applied at parse and logged. Other suspect coords (Kabwazi/Mtubwi
 * missing minus signs, Madise -11.25) are left untouched — those blocks resolve
 * via docx hints so the bad coords affect only distance annotations.
 */
const SOURCE_COORD_FIXES: Record<string, { latitude: number; longitude: number; reason: string }> = {
  '10. Karonga District::baka': {
    latitude: -9.93333,
    longitude: 33.91667,
    reason: 'xlsx lat/lon swapped; corrected point verified INSIDE mpata_epa by geo thread',
  },
};

function cellText(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'object') {
    const o = v as { text?: unknown; result?: unknown };
    if (typeof o.text === 'string') return o.text.trim() || null;
    if (o.result !== undefined) return cellText(o.result);
    return null;
  }
  const s = String(v).trim();
  return s === '' ? null : s;
}

function cellNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'object') {
    const o = v as { result?: unknown };
    if (o.result !== undefined) return cellNumber(o.result);
    return null;
  }
  const s = String(v).trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function isBlankRow(cells: (string | null)[]): boolean {
  // Separator rows sometimes carry stray source-column (M) text; only the
  // data columns A-L (0-11) delimit EPA blocks.
  return cells.slice(0, 12).every((c) => c === null);
}

async function parseWorkbook(): Promise<{
  blocks: IEpaBlock[];
  appliedFixes: { block: string; latitude: number; longitude: number; reason: string }[];
}> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ExcelJS = require('exceljs');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(INPUT_PATH);
  const blocks: IEpaBlock[] = [];
  const appliedFixes: { block: string; latitude: number; longitude: number; reason: string }[] = [];
  wb.eachSheet((ws: { name: string; rowCount: number; getRow: (n: number) => { values: unknown[] } }) => {
    const sheet = ws.name as string;
    const sheetDistrict = SHEET_TO_DISTRICT[sheet];
    if (!sheetDistrict) throw new Error(`Unknown sheet (no SHEET_TO_DISTRICT entry): ${sheet}`);
    // Rows 1-based; row 1 is the header. Cols A-N -> values[1..14] (N = epa_canonical).
    type RowCells = { cells: (string | null)[]; numbers: (number | null)[] };
    const dataRows: { n: number; cells: RowCells }[] = [];
    for (let n = 2; n <= ws.rowCount; n++) {
      const values = ws.getRow(n).values as unknown[];
      const col = (i: number): unknown => (Array.isArray(values) ? values[i] : undefined);
      const cells = Array.from({ length: 14 }, (_, k) => cellText(col(k + 1)));
      const numbers = Array.from({ length: 14 }, (_, k) => cellNumber(col(k + 1)));
      dataRows.push({ n, cells: { cells, numbers } });
    }
    // Split on fully-blank rows (trailing blanks at sheet end are ignored)
    let current: { n: number; cells: (string | null)[]; numbers: (number | null)[] }[] = [];
    const flush = () => {
      const nonBlank = current.filter((r) => !isBlankRow(r.cells));
      if (nonBlank.length > 0) {
        const first = nonBlank[0];
        // District/AEZ are only written on some header rows: first non-blank
        // wins, falling back to the sheet's district for district.
        const districtRaw = nonBlank.map((r) => r.cells[0]).find((c) => c !== null) ?? sheetDistrict;
        const agroZoneRaw = nonBlank.map((r) => r.cells[1]).find((c) => c !== null) ?? null;
        const epaColumnRaw = cellText(first.cells[13]);
        const stationRaw = first.cells[2];
        const key = stableBlockKey(sheet, stationRaw);
        const fix = SOURCE_COORD_FIXES[key];
        const latitude = fix ? fix.latitude : first.numbers[3];
        const longitude = fix ? fix.longitude : first.numbers[4];
        if (fix) {
          appliedFixes.push({ block: key, latitude, longitude, reason: fix.reason });
          console.log(`  Source coord fix: ${key} -> [${latitude}, ${longitude}] (${fix.reason})`);
        }
        blocks.push({
          key,
          sheet,
          startRow: first.n,
          districtRaw,
          agroZoneRaw,
          stationRaw,
          latitude,
          longitude,
          reasonRaw: first.cells[5],
          epaColumnRaw,
          rows: nonBlank.map((r) => ({
            rowNumber: r.n,
            district: districtRaw,
            agroZone: agroZoneRaw,
            cropRaw: r.cells[6],
            varietyRaw: r.cells[7],
            localRaw: r.cells[8],
            maturityRaw: r.cells[9],
            daysRaw: r.cells[10],
            waterRaw: r.numbers[11],
            waterText: r.cells[11],
            sourceRaw: r.cells[12],
          })),
        });
      }
      current = [];
    };
    for (const r of dataRows) {
      if (isBlankRow(r.cells.cells)) {
        flush();
      } else {
        current.push({ n: r.n, cells: r.cells.cells, numbers: r.cells.numbers });
      }
    }
    flush();
  });
  return { blocks, appliedFixes };
}

// ---------------------------------------------------------------------------
// Cleaning
// ---------------------------------------------------------------------------
const DESCRIPTIVE_VARIETY_PREFIX = /^(hybrid varieties|opv varieties|local varieties)\s*[:;]?\s*/i;

/**
 * Normalise maturity labels (trim + title case) so case variants ('Medium' vs
 * 'medium') don't read as inconsistencies; genuine typos ('Midium') stay
 * distinct and get flagged in review.
 */
function normaliseMaturity(raw: string | null): string | null {
  const t = (raw ?? '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : null;
}

function cleanVarietyCell(raw: string | null): string {
  if (!raw) return '';
  return raw.replace(DESCRIPTIVE_VARIETY_PREFIX, '').trim();
}

interface ICleanedOccurrence {
  blockKey: string;
  locationId: string;
  crop: ICropName;
  variety: string;
  localName?: string;
  daysLower: number;
  daysUpper: number;
  daysRaw: string;
  maturity: string | null;
  water: number;
  stationRaw: string | null;
}

interface ICleanResult {
  occurrences: ICleanedOccurrence[];
  stats: {
    blankCropForwardFilled: number;
    waterZeroOrBlankSkipped: number;
    unmappedCropSkipped: number;
    emptyVarietySkipped: number;
  };
  unmappedCrops: Record<string, number>;
  zeroWaterByCrop: Record<string, number>;
}

function cleanBlocks(blocks: { block: IEpaBlock; locationIds: string[] }[]): ICleanResult {
  const occurrences: ICleanedOccurrence[] = [];
  const stats = {
    blankCropForwardFilled: 0,
    waterZeroOrBlankSkipped: 0,
    unmappedCropSkipped: 0,
    emptyVarietySkipped: 0,
  };
  const unmappedCrops: Record<string, number> = {};
  const zeroWaterByCrop: Record<string, number> = {};
  for (const { block, locationIds } of blocks) {
    let carryCrop: string | null = null;
    for (const row of block.rows) {
      let cropRaw = row.cropRaw;
      if (!cropRaw) {
        cropRaw = carryCrop;
        if (cropRaw) stats.blankCropForwardFilled++;
      } else {
        carryCrop = cropRaw;
      }
      const crop = canonicaliseCropName(cropRaw);
      if (!crop) {
        stats.unmappedCropSkipped++;
        const k = (cropRaw ?? '(blank)').trim() || '(blank)';
        unmappedCrops[k] = (unmappedCrops[k] ?? 0) + 1;
        continue;
      }
      // Perennial/no-seasonal-requirement rows carry water 0 or blank: skip from
      // water_requirements (mostly cassava; also banana which is unmapped anyway).
      if (row.waterRaw === null || row.waterRaw === 0) {
        stats.waterZeroOrBlankSkipped++;
        zeroWaterByCrop[crop] = (zeroWaterByCrop[crop] ?? 0) + 1;
        continue;
      }
      // Match the dashboard prod convention (admin import rounds water to nearest
      // 5mm): consultant cells carry spreadsheet float artifacts (e.g. 240.7999…)
      const water = roundToNearest(row.waterRaw, 5);
      const maturity = normaliseMaturity(row.maturityRaw);
      const varietyCell = cleanVarietyCell(row.varietyRaw);
      if (!varietyCell || /^(none|n\/a|-+)$/i.test(varietyCell)) {
        if (/^local$/i.test(varietyCell)) {
          const days = parseDaysRange(row.daysRaw ?? '');
          for (const locationId of locationIds) {
            occurrences.push({
              blockKey: block.key,
              locationId,
              crop,
              variety: 'LOCAL',
              daysLower: days.days_lower,
              daysUpper: days.days_upper,
              daysRaw: days.raw,
              maturity,
              water,
              stationRaw: block.stationRaw,
            });
          }
          continue;
        }
        stats.emptyVarietySkipped++;
        continue;
      }
      const days = parseDaysRange(row.daysRaw ?? '');
      const parsed = parseVarietyString(varietyCell);
      const tokens = parsed.length > 0 ? parsed : [{ variety: varietyCell, raw_token: varietyCell }];
      for (const token of tokens) {
        const sanitized = sanitizeCropVarietyMapping(crop, 'variety' in token ? token.variety : varietyCell);
        if (!sanitized.valid) continue;
        const finalCrop = (canonicaliseCropName(sanitized.normalizedCrop) ?? crop) as ICropName;
        const localName =
          'local_name' in token && token.local_name
            ? token.local_name
            : [row.localRaw, sanitized.normalizedCrop !== crop ? sanitized.normalizedCrop : null]
                .filter(Boolean)
                .join(' ') || undefined;
        for (const locationId of locationIds) {
          occurrences.push({
            blockKey: block.key,
            locationId,
            crop: finalCrop,
            variety: sanitized.normalizedVariety,
            localName,
            daysLower: days.days_lower,
            daysUpper: days.days_upper,
            daysRaw: days.raw,
            maturity,
            water,
            stationRaw: block.stationRaw,
          });
        }
      }
    }
  }
  return { occurrences, stats, unmappedCrops, zeroWaterByCrop };
}

// ---------------------------------------------------------------------------
// CLI (one-shot: no consumer flags except --upsert; --write-epa-column is a
// maintainer-only backfill for the workbook's epa_canonical column)
// ---------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2);
  const has = (name: string): boolean => args.includes(`--${name}`);
  const mode = has('upsert') ? 'upsert' : has('write-epa-column') ? 'write-epa-column' : 'run';
  // Default to the local dev container when no remote credentials file exists.
  const serverEnv = resolve(__dirname, '../../../../../../apps/picsa-server/.env.server');
  return { mode, local: !existsSync(serverEnv) };
}

/** Parse the workbook's `epa_canonical` column (col N) into an id list. */
function parseEpaColumn(raw: string | null): string[] | null {
  if (!raw) return null;
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length > 0 ? ids : null;
}

/** Write per-district block JSONs plus a typed index (compile-time shape check). */
async function writeBlockSplits(blocks: IEpaBlock[]): Promise<void> {
  const dir = resolve(INTERMEDIATES_DIR, 'blocks');
  await ensureDir(dir);
  const byDistrict = new Map<string, IEpaBlock[]>();
  for (const b of blocks) {
    const district = SHEET_TO_DISTRICT[b.sheet] ?? 'unknown';
    byDistrict.set(district, [...(byDistrict.get(district) ?? []), b]);
  }
  const names: string[] = [];
  for (const [district, list] of [...byDistrict.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const file = `${district}.json`;
    await writeJson(resolve(dir, file), list, { spaces: 2 });
    names.push(district);
  }
  const lines = [
    `// Auto-generated verification index — do not edit.`,
    `// Regenerate: yarn scripts picsa/crop-probability/mw-consultant/import-mw-epa-water-requirements`,
    `import type { IEpaBlock } from '../../block-types';`,
    ``,
  ];
  for (const name of names) lines.push(`import ${name} from './${name}.json';`);
  lines.push(``, `export const MW_EPA_BLOCKS: Record<string, IEpaBlock[]> = {`);
  for (const name of names) lines.push(`  ${name},`);
  lines.push(`};`, ``);
  await writeFile(resolve(dir, 'index.ts'), lines.join('\n'), 'utf-8');
  console.log(`  Wrote ${names.length} district splits + index.ts: ${dir}`);
}

async function writeEpaColumn(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ExcelJS = require('exceljs');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(INPUT_PATH);
  const { blocks: parsedBlocks } = await parseWorkbook();
  const blocks = parsedBlocks;
  const bySheetStartRow = new Map(blocks.map((b) => [`${b.sheet}::${b.startRow}`, b]));
  let written = 0;
  let skipped = 0;
  wb.eachSheet(
    (ws: { name: string; rowCount: number; getRow: (n: number) => { getCell: (c: number) => { value: unknown } } }) => {
      for (let n = 2; n <= ws.rowCount; n++) {
        const block = bySheetStartRow.get(`${ws.name}::${n}`);
        if (!block) continue;
        const entry = getEpaMapping(block.key);
        if (entry === undefined || entry === null) {
          // Clear any stale value so col N always mirrors the mapping table
          if (ws.getRow(n).getCell(EPA_COLUMN).value) skipped++;
          ws.getRow(n).getCell(EPA_COLUMN).value = null;
          continue;
        }
        ws.getRow(n).getCell(EPA_COLUMN).value = [entry].flat().join(', ');
        written++;
      }
      ws.getRow(1).getCell(EPA_COLUMN).value = 'epa_canonical';
    },
  );
  await wb.xlsx.writeFile(INPUT_PATH);
  console.log(`  Wrote epa_canonical (col N) for ${written} blocks, ${skipped} unmapped left blank`);
}

async function main() {
  const { mode, local } = parseArgs();
  if (!existsSync(INPUT_XLSX)) throw new Error(`Input not found: ${INPUT_XLSX}`);
  await ensureDir(INTERMEDIATES_DIR);
  await ensureDir(REVIEW_DIR);

  console.log(`\n[MW EPA import] mode=${mode}`);
  if (mode === 'write-epa-column') {
    await writeEpaColumn();
    console.log('  Re-run without flags to verify the column reads back.\n');
    return;
  }
  const { blocks, appliedFixes: sourceCoordFixes } = await parseWorkbook();
  console.log(`  Parsed ${blocks.length} EPA blocks`);

  await writeBlockSplits(blocks);

  const epaCoords: Map<string, (typeof MW_EPAS)[number]> = new Map(MW_EPAS.map((e) => [e.id, e]));
  // EPA mapping (+ unmapped report, never invent slugs). The workbook's
  // `epa_canonical` column (col N) is cross-checked against epa-mapping.ts.
  const mapped: { block: IEpaBlock; locationIds: string[] }[] = [];
  const unmappedBlocks: { key: string; reason: string | null; station: string | null }[] = [];
  for (const b of blocks) {
    const columnIds = parseEpaColumn(b.epaColumnRaw);
    const entry = getEpaMapping(b.key);
    if (columnIds) {
      const mappedIds = entry === undefined || entry === null ? [] : [entry].flat();
      const same = mappedIds.length === columnIds.length && mappedIds.every((id) => columnIds.includes(id));
      if (!same) {
        throw new Error(
          `epa_canonical column mismatch for ${b.key}: column=[${columnIds.join(', ')}] mapping=[${mappedIds.join(', ')}]`,
        );
      }
    }
    if (entry === undefined) {
      unmappedBlocks.push({ key: b.key, reason: `no mapping entry (${b.reasonRaw ?? '?'})`, station: b.stationRaw });
    } else if (entry === null) {
      unmappedBlocks.push({ key: b.key, reason: b.reasonRaw, station: b.stationRaw });
    } else {
      mapped.push({ block: b, locationIds: Array.isArray(entry) ? entry : [entry] });
    }
  }
  // Validate mapped ids against canonical list
  const unknownSlugs = new Set<string>();
  for (const m of mapped) for (const id of m.locationIds) if (!epaCoords.has(id)) unknownSlugs.add(id);
  if (unknownSlugs.size > 0) throw new Error(`EPA mapping references unknown slugs: ${[...unknownSlugs].join(', ')}`);

  console.log(`  EPA-mapped blocks: ${mapped.length}, unmapped (skipped): ${unmappedBlocks.length}`);

  // Supabase lookups (stations + station data + existing varieties)
  const supabase = getSyncSupabaseClient({ local });
  const [{ data: stationsRaw }, { data: stationDataRaw }, { data: cropDataRaw }] = await Promise.all([
    supabase
      .from('climate_stations')
      .select('id,station_id,station_name,district,latitude,longitude')
      .eq('country_code', COUNTRY_CODE),
    supabase
      .from('climate_station_data')
      .select('station_id,annual_rainfall_data,crop_probability_data')
      .eq('country_code', COUNTRY_CODE),
    supabase
      .from('crop_data')
      .select('crop,variety,days_lower,days_upper,maturity_period')
      .eq('country_code', COUNTRY_CODE),
  ]);
  const stations = (stationsRaw ?? []) as IClimateStationRef[];
  const stationDataById = new Map(
    (
      (stationDataRaw ?? []) as {
        station_id: string;
        annual_rainfall_data: unknown[];
        crop_probability_data: unknown[];
      }[]
    ).map((r) => [r.station_id, r]),
  );
  const dataStationIds = new Set(
    [...stationDataById.entries()]
      .filter(([, r]) => (r.annual_rainfall_data ?? []).length > 0 && (r.crop_probability_data ?? []).length > 0)
      .map(([id]) => id),
  );
  console.log(
    `  climate_stations: ${stations.length}, station_data rows: ${stationDataById.size} (${dataStationIds.size} with data)`,
  );

  // Station resolution per block
  const stationByBlock = new Map<string, { station_id: string | null; method: string; detail: string }>();
  for (const { block } of mapped) {
    const res = resolveStationId(block.stationRaw, block.latitude, block.longitude, stations, dataStationIds);
    stationByBlock.set(block.key, res);
  }
  const unresolvedStations = [...stationByBlock.entries()].filter(([, r]) => !r.station_id);
  console.log(
    `  stations resolved: ${stationByBlock.size - unresolvedStations.length}, unresolved: ${unresolvedStations.length}`,
  );

  // Cleaning
  const cleaned = cleanBlocks(mapped);
  console.log(`  occurrences: ${cleaned.occurrences.length}`, JSON.stringify(cleaned.stats));
  // Raw occurrence ledger for per-variety consistency + outlier review
  await writeJson(resolve(INTERMEDIATES_DIR, 'variety-ledger.json'), cleaned.occurrences, { spaces: 2 });

  // Merge to per-location water requirements + variety definitions (modal days)
  interface IVarietyAcc {
    crop: ICropName;
    variety: string;
    waters: number[];
    dayPairs: Map<string, { lower: number; upper: number; count: number }>;
    maturities: Map<string, number>;
    localNames: Set<string>;
    blocks: Set<string>;
  }
  const varietyAcc = new Map<string, IVarietyAcc>();
  interface IWaterSample {
    water: number;
    blockKey: string;
    stationId: string | null;
    daysLower: number;
    daysUpper: number;
  }
  const waterByLocation = new Map<string, Map<string, Map<string, IWaterSample[]>>>();
  const stationVotes = new Map<string, Map<string, number>>();
  for (const o of cleaned.occurrences) {
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
    const res = stationByBlock.get(o.blockKey);
    if (res?.station_id) {
      let votes = stationVotes.get(o.locationId);
      if (!votes) {
        votes = new Map();
        stationVotes.set(o.locationId, votes);
      }
      votes.set(res.station_id, (votes.get(res.station_id) ?? 0) + 1);
    }
  }
  // Variety definitions use modal days_lower/upper across occurrences
  const varietyDefs = [...varietyAcc.values()].map((acc) => {
    const modal = [...acc.dayPairs.values()].sort((a, b) => b.count - a.count)[0];
    const maturity = [...acc.maturities.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]?.trim() || null;
    return {
      country_code: COUNTRY_CODE,
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
  // Overlap report: new defs vs existing MW crop_data (global ids — overwrites
  // also affect other countries sharing the same crop/variety id on re-sync)
  const existingByVariety = new Map(
    ((cropDataRaw ?? []) as { crop: string; variety: string; days_lower: number; days_upper: number }[]).map((r) => [
      `${r.crop}/${r.variety}`,
      r,
    ]),
  );
  const varietyOverlap = varietyDefs
    .filter((d) => existingByVariety.has(`${d.crop}/${d.variety}`))
    .map((d) => {
      const e = existingByVariety.get(`${d.crop}/${d.variety}`) as { days_lower: number; days_upper: number };
      return {
        crop: d.crop,
        variety: d.variety,
        existing_days: `${e.days_lower}-${e.days_upper}`,
        new_days: `${d.days_lower}-${d.days_upper}`,
        changed: e.days_lower !== d.days_lower || e.days_upper !== d.days_upper,
      };
    });
  const defDaysByVariety = new Map(
    varietyDefs.map((d) => [`${d.crop}/${d.variety}`, `${d.days_lower}-${d.days_upper}`]),
  );
  // Per-location water requirements. The same variety can appear in several rows
  // (different maturity/day rows, or duplicate EPA blocks). Group samples by days
  // range first and keep the modal group (matching the variety definition); within
  // it use the mean unless samples conflict by >20% (probable consultant typo),
  // in which case the value from the block nearest the EPA wins and the conflict
  // is logged for review (e.g. Dowa 135-day maize 378 vs 3715mm).
  const stationCoordsById = new Map(stations.map((s) => [s.id, s]));
  const meanRound = (xs: number[]): number => roundToNearest(xs.reduce((a, b) => a + b, 0) / xs.length, 5);
  const waterConflicts: {
    location_id: string;
    crop: string;
    variety: string;
    samples: { water: number; blockKey: string; stationId: string | null }[];
    chosen: number;
    strategy: 'mean' | 'nearest-epa' | 'modal-days';
  }[] = [];
  const downscaled = [...waterByLocation.entries()].map(([locationId, crops]) => {
    const water_requirements: Record<string, Record<string, number>> = {};
    const epa = epaCoords.get(locationId);
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
          water_requirements[crop][variety] = meanRound(waters);
          continue;
        }
        // Extreme conflict: prefer the block whose station is nearest the EPA
        const ranked = samples.map((s) => {
          const st = (s.stationId && stationCoordsById.get(s.stationId)) || null;
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
        waterConflicts.push({ location_id: locationId, crop, variety, samples, chosen, strategy: 'nearest-epa' });
      }
    }
    const votes = stationVotes.get(locationId);
    const station_id = votes ? [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0] : null;
    return { country_code: COUNTRY_CODE, location_id: locationId, water_requirements, station_id };
  });
  console.log(`  water conflicts (>20% duplicate spread, nearest-EPA wins): ${waterConflicts.length}`);

  // QC pre-check per location (ENFORCE_LOOKUP_BOUNDS; locationId/stationId attributed)
  const cropDataHashmap: Record<string, { days_lower: number; days_upper: number }> = {};
  for (const row of (cropDataRaw ?? []) as {
    crop: string;
    variety: string;
    days_lower: number;
    days_upper: number;
  }[]) {
    cropDataHashmap[`${row.crop}/${row.variety}`] = row;
  }
  for (const def of varietyDefs) cropDataHashmap[`${def.crop}/${def.variety}`] = def;
  const qcSummaries: unknown[] = [];
  let qcIncluded = 0;
  let qcExcluded = 0;
  let qcSkipped = 0;
  for (const row of downscaled) {
    const stationData = row.station_id ? stationDataById.get(row.station_id) : undefined;
    if (!stationData) {
      qcSkipped++;
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
      qcSkipped++;
      qcSummaries.push({
        location_id: row.location_id,
        station_id: row.station_id,
        status: 'SKIPPED',
        reason: 'insufficient station data',
      });
      continue;
    }
    const excluded = expected.qc.results.filter((r) => !r.included);
    qcIncluded += expected.qc.includedCount;
    qcExcluded += expected.qc.excludedCount;
    qcSummaries.push({
      location_id: row.location_id,
      station_id: row.station_id,
      status: excluded.length > 0 ? 'QC_EXCLUSIONS' : 'OK',
      included: expected.qc.includedCount,
      excluded: expected.qc.excludedCount,
      exclusions: excluded.map((r) => ({
        crop: r.crop,
        variety: r.variety,
        water: r.waterRequirement,
        failures: r.failures,
      })),
    });
  }
  console.log(`  QC: included=${qcIncluded} excluded=${qcExcluded} locations-skipped=${qcSkipped}`);

  // Per-crop reporting summary: water ranges, maturity/days discrepancies
  const cropSummary = (() => {
    const acc = new Map<
      string,
      { varieties: Set<string>; waters: number[]; days: Set<string>; maturities: Set<string>; occurrences: number }
    >();
    for (const o of cleaned.occurrences) {
      let e = acc.get(o.crop);
      if (!e) {
        e = { varieties: new Set(), waters: [], days: new Set(), maturities: new Set(), occurrences: 0 };
        acc.set(o.crop, e);
      }
      e.varieties.add(o.variety);
      e.waters.push(o.water);
      e.days.add(`${o.daysLower}-${o.daysUpper}`);
      if (o.maturity) e.maturities.add(o.maturity.trim());
      e.occurrences++;
    }
    return [...acc.entries()]
      .sort((a, b) => b[1].occurrences - a[1].occurrences)
      .map(([crop, e]) => ({
        crop,
        varieties: e.varieties.size,
        occurrences: e.occurrences,
        water_min: Math.min(...e.waters),
        water_max: Math.max(...e.waters),
        days_ranges: [...e.days].sort(),
        maturities: [...e.maturities].sort(),
      }));
  })();

  // Canonical EPAs with no consultant data (orphans by design — slugs never invented)
  const importedIds = new Set(downscaled.map((d) => d.location_id));
  const orphanEpas = MW_EPAS.filter((e) => !importedIds.has(e.id)).map((e) => ({
    id: e.id,
    label: e.label,
    district: e.district,
  }));
  const orphansByDistrict = (() => {
    const m = new Map<string, string[]>();
    for (const o of orphanEpas) m.set(o.district, [...(m.get(o.district) ?? []), o.id]);
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([district, ids]) => ({ district, ids }));
  })();

  // Unmapped-block tracking: consultant EPA name, EPA-by-coordinates, verdict.
  // Coordinates outside the Malawi bbox are flagged suspect (known xlsx typos:
  // missing minus signs, swapped lat/lon) and excluded from proximity ranking.
  const inMalawi = (lat: number | null, lon: number | null): lat is number =>
    typeof lat === 'number' && typeof lon === 'number' && lat >= -20 && lat <= -5 && lon >= 30 && lon <= 40;
  const extractConsultantEpa = (reason: string | null): string | null => {
    if (!reason) return null;
    const names = [...reason.matchAll(/([A-Za-z'\-. ]+?)\s*EPA/gi)]
      .map((m) => m[1].replace(/.*serves?\s+/i, '').trim())
      .filter(Boolean);
    return names.length > 0 ? names.join(' + ') : null;
  };
  const unmappedTracking = unmappedBlocks.map((u) => {
    const block = blocks.find((b) => b.key === u.key);
    const coordsOk = inMalawi(block?.latitude ?? null, block?.longitude ?? null);
    let nearest: { id: string; km: number } | null = null;
    let nearestInDistrict: { id: string; km: number } | null = null;
    if (coordsOk && block) {
      const ranked = MW_EPAS.map((e) => ({
        id: e.id,
        district: e.district,
        km: haversineKm(
          block.latitude as number,
          block.longitude as number,
          e.coordinates.latitude,
          e.coordinates.longitude,
        ),
      })).sort((a, b) => a.km - b.km);
      nearest = { id: ranked[0].id, km: Math.round(ranked[0].km * 10) / 10 };
      const sheetDistrict = SHEET_TO_DISTRICT[block.sheet];
      const inDist = ranked.find((r) => r.district === sheetDistrict);
      if (inDist) nearestInDistrict = { id: inDist.id, km: Math.round(inDist.km * 10) / 10 };
    }
    const verdict = getUnmappedVerdict(u.key);
    if (!verdict) throw new Error(`No verdict recorded for unmapped block: ${u.key}`);
    return {
      block: u.key,
      consultantEpa: extractConsultantEpa(block?.reasonRaw ?? u.reason) ?? '(none named)',
      coords: coordsOk ? `${block?.latitude}, ${block?.longitude}` : 'SUSPECT (outside Malawi bbox)',
      nearestCanonicalEpa: nearest,
      nearestInSheetDistrict: nearestInDistrict,
      verdict: verdict.verdict,
      mappedEpa: verdict.mappedEpa ?? null,
      rationale: verdict.note,
    };
  });
  // Every verdict must correspond to an unmapped block and vice versa
  const verdictKeys = new Set(unmappedTracking.map((t) => t.block));
  for (const b of unmappedBlocks) {
    if (!verdictKeys.has(b.key)) throw new Error(`Unmapped block missing a verdict: ${b.key}`);
  }

  // Per-variety consistency ledger: maturity + days should be static per variety;
  // only water varies. Flags MULTI_DAYS / MULTI_MATURITY for review.
  const varietyLedger = (() => {
    const acc = new Map<
      string,
      {
        crop: string;
        variety: string;
        days: Map<string, number>;
        maturities: Map<string, number>;
        waters: number[];
        blocks: Set<string>;
      }
    >();
    for (const o of cleaned.occurrences) {
      const k = `${o.crop}/${o.variety}`;
      let e = acc.get(k);
      if (!e) {
        e = { crop: o.crop, variety: o.variety, days: new Map(), maturities: new Map(), waters: [], blocks: new Set() };
        acc.set(k, e);
      }
      const dk = `${o.daysLower}-${o.daysUpper}`;
      e.days.set(dk, (e.days.get(dk) ?? 0) + 1);
      const mk = (o.maturity ?? '(blank)').trim() || '(blank)';
      e.maturities.set(mk, (e.maturities.get(mk) ?? 0) + 1);
      e.waters.push(o.water);
      e.blocks.add(o.blockKey);
    }
    const defDays = new Map(varietyDefs.map((d) => [`${d.crop}/${d.variety}`, `${d.days_lower}-${d.days_upper}`]));
    return [...acc.values()]
      .sort((a, b) => a.crop.localeCompare(b.crop) || a.variety.localeCompare(b.variety))
      .map((e) => {
        const flags: string[] = [];
        if (e.days.size > 1) flags.push('MULTI_DAYS');
        if (e.maturities.size > 1) flags.push('MULTI_MATURITY');
        const sorted = [...e.waters].sort((x, y) => x - y);
        return {
          crop: e.crop,
          variety: e.variety,
          defDays: defDays.get(`${e.crop}/${e.variety}`) ?? '?',
          observedDays: [...e.days.entries()].sort((a, b) => b[1] - a[1]).map(([d, n]) => `${d} (x${n})`),
          maturities: [...e.maturities.entries()].sort((a, b) => b[1] - a[1]).map(([m, n]) => `${m} (x${n})`),
          waterMin: Math.min(...e.waters),
          waterMax: Math.max(...e.waters),
          waterMedian: sorted[Math.floor(sorted.length / 2)],
          blocks: e.blocks.size,
          flags,
        };
      });
  })();

  // Outliers: raw ledger waters outside Q1-3*IQR / Q3+3*IQR within each crop.
  const outliers = (() => {
    const byCrop = new Map<string, number[]>();
    for (const o of cleaned.occurrences) byCrop.set(o.crop, [...(byCrop.get(o.crop) ?? []), o.water]);
    const bounds = new Map<string, { lo: number; hi: number; median: number }>();
    for (const [crop, ws] of byCrop) {
      const s = [...ws].sort((a, b) => a - b);
      const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
      const q1 = q(0.25);
      const q3 = q(0.75);
      const iqr = q3 - q1;
      bounds.set(crop, { lo: q1 - 3 * iqr, hi: q3 + 3 * iqr, median: s[Math.floor(s.length / 2)] });
    }
    const resolved = new Set(
      waterConflicts
        .filter((c) => c.strategy === 'nearest-epa')
        .flatMap((c) => c.samples.map((s) => `${c.location_id}|${c.crop}|${c.variety}|${s.blockKey}|${s.water}`)),
    );
    return cleaned.occurrences
      .filter((o) => {
        const b = bounds.get(o.crop);
        return b !== undefined && (o.water < b.lo || o.water > b.hi);
      })
      .map((o) => {
        const b = bounds.get(o.crop) as { lo: number; hi: number; median: number };
        return {
          crop: o.crop,
          variety: o.variety,
          water: o.water,
          block: o.blockKey,
          days: `${o.daysLower}-${o.daysUpper}`,
          cropMedian: b.median,
          resolvedByMerge: resolved.has(`${o.locationId}|${o.crop}|${o.variety}|${o.blockKey}|${o.water}`),
        };
      })
      .sort((a, b) => b.water - a.water);
  })();

  const audit = {
    mode,
    blocksParsed: blocks.length,
    blocksProcessed: blocks.length,
    epaMappedBlocks: mapped.length,
    unmappedBlocks,
    stationResolutions: [...stationByBlock.entries()].map(([blockKey, r]) => ({ blockKey, ...r })),
    unresolvedStations,
    cleanStats: cleaned.stats,
    unmappedCrops: cleaned.unmappedCrops,
    zeroWaterByCrop: cleaned.zeroWaterByCrop,
    locations: downscaled.length,
    varietyDefs: varietyDefs.length,
    varietyOverlap,
    waterConflicts,
    cropSummary,
    orphanEpas,
    orphansByDistrict,
    unmappedTracking,
    sourceCoordFixes,
    varietyLedger,
    outliers,
    qc: { included: qcIncluded, excluded: qcExcluded, skippedLocations: qcSkipped, summaries: qcSummaries },
    downscaled,
    varietyDefs,
  };
  await writeJson(resolve(INTERMEDIATES_DIR, 'mw-epa-audit.json'), audit, { spaces: 2 });
  console.log(`  Wrote intermediates audit: ${resolve(INTERMEDIATES_DIR, 'mw-epa-audit.json')}`);
  await writeReview(audit);
  await writeProdSql(varietyDefs, downscaled);

  if (mode !== 'upsert') {
    console.log('\n  Done — no database writes. Review review/*.md, then re-run with --upsert.\n');
    return;
  }

  // Upsert variety definitions then downscaled rows
  console.log(`  Upserting ${varietyDefs.length} crop_data rows...`);
  const { error: cropErr } = await supabase.from('crop_data').upsert(varietyDefs, { onConflict: 'id' });
  if (cropErr) throw new Error(`crop_data upsert failed: ${cropErr.message}`);
  console.log(`  Upserting ${downscaled.length} crop_data_downscaled rows...`);
  const { error: downErr } = await supabase.from('crop_data_downscaled').upsert(downscaled, { onConflict: 'id' });
  if (downErr) throw new Error(`crop_data_downscaled upsert failed: ${downErr.message}`);
  console.log('\n  Upsert complete. Verify with: yarn scripts:crop:sync --country=mw --audit-only\n');
}

/** One-time prod upload script (committed). Mirrors the API upserts row-for-row. */
async function writeProdSql(
  varietyDefs: {
    country_code: string;
    crop: string;
    variety: string;
    maturity_period: string | null;
    days_lower: number;
    days_upper: number;
    additional_info: string | null;
    additional_data: unknown;
  }[],
  downscaled: {
    country_code: string;
    location_id: string;
    water_requirements: unknown;
    station_id: string | null;
  }[],
): Promise<void> {
  await ensureDir(SQL_DIR);
  const q = (v: string): string => `'${v.replace(/'/g, "''")}'`;
  const qn = (v: string | null): string => (v === null ? 'NULL' : q(v));
  const qj = (v: unknown): string => q(JSON.stringify(v));
  const lines = [
    `-- MW consultant EPA water-requirements — one-time prod upload.`,
    `-- Generated by apps/picsa-scripts/src/picsa/crop-probability/mw-consultant/import-mw-epa-water-requirements.ts`,
    `-- (${varietyDefs.length} crop_data rows, ${downscaled.length} crop_data_downscaled rows).`,
    `-- Idempotent: INSERT ... ON CONFLICT (id) DO UPDATE. Review the audit`,
    `-- (review/*.md + intermediates/mw-epa-audit.json) before applying. Requires migration`,
    `-- 20260808091500_allow_null_maturity_period (maturity_period may be NULL).`,
    `BEGIN;`,
    ``,
    `-- 1. Variety definitions (crop_data; id is crop/variety, shared globally)`,
  ];
  for (const d of varietyDefs) {
    lines.push(
      `INSERT INTO public.crop_data (country_code, crop, variety, maturity_period, days_lower, days_upper, additional_info, additional_data)`,
      `VALUES (${q(d.country_code)}, ${q(d.crop)}, ${q(d.variety)}, ${qn(d.maturity_period)}, ${d.days_lower}, ${d.days_upper}, ${qn(d.additional_info)}, ${qj(d.additional_data)}::jsonb)`,
      `ON CONFLICT (id) DO UPDATE SET maturity_period = EXCLUDED.maturity_period, days_lower = EXCLUDED.days_lower, days_upper = EXCLUDED.days_upper, additional_info = EXCLUDED.additional_info, additional_data = EXCLUDED.additional_data, updated_at = now();`,
      ``,
    );
  }
  lines.push(`-- 2. Per-EPA water requirements (id is country_code/location_id)`);
  for (const d of downscaled) {
    lines.push(
      `INSERT INTO public.crop_data_downscaled (country_code, location_id, water_requirements, station_id)`,
      `VALUES (${q(d.country_code)}, ${q(d.location_id)}, ${qj(d.water_requirements)}::jsonb, ${qn(d.station_id)})`,
      `ON CONFLICT (id) DO UPDATE SET water_requirements = EXCLUDED.water_requirements, station_id = EXCLUDED.station_id, updated_at = now();`,
      ``,
    );
  }
  lines.push(`COMMIT;`, ``);
  const sqlPath = resolve(SQL_DIR, 'mw-epa-prod-upsert.sql');
  await writeFile(sqlPath, lines.join('\n'), 'utf-8');
  console.log(`  Wrote prod SQL: ${sqlPath}`);
}

// ---------------------------------------------------------------------------
// Human-readable review outputs (review/*.md, committed). Aggregate tables and
// anomalies only — full per-block detail lives in intermediates/mw-epa-audit.json.
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function writeReview(audit: any): Promise<void> {
  await ensureDir(REVIEW_DIR);
  const { writeFile } = await import('node:fs/promises');
  const write = async (name: string, lines: string[]) => {
    await writeFile(resolve(REVIEW_DIR, name), lines.join('\n'), 'utf-8');
    console.log(`  Wrote review: ${resolve(REVIEW_DIR, name)}`);
  };
  const defCount = (audit.varietyDefs ?? []).length;

  await write('summary.md', [
    `# MW EPA import — review summary`,
    ``,
    `One-shot consultant import: 28 xlsx sheets → **${audit.blocksParsed} EPA blocks** → **${audit.locations} EPA locations** (${audit.epaMappedBlocks} blocks mapped, ${audit.unmappedBlocks.length} unmapped), **${defCount} variety definitions**.`,
    `QC (ENFORCE_LOOKUP_BOUNDS): included=${audit.qc.included} excluded=${audit.qc.excluded} skipped-locations=${audit.qc.skippedLocations}.`,
    ``,
    `## What to check (in order)`,
    ``,
    `1. \`consultant-feedback.md\` — what we dropped, corrected, and need confirmed. **Send this to the consultants.**`,
    `2. \`summary.md\` — counts, decisions (this file).`,
    `1. \`coverage.md\` — unmapped blocks with EPA-by-coordinates evidence and verdicts; mapped EPA ids mirror the workbook col N.`,
    `2. \`varieties.md\` — flagged MULTI_DAYS / MULTI_MATURITY varieties, then the full per-variety ledger.`,
    `3. \`outliers.md\` — raw water values outside Q1−3·IQR / Q3+3·IQR per crop, with source blocks.`,
    `4. \`water.md\` — duplicate-block disagreements and changed variety days.`,
    `5. \`stations.md\` — far (>50 km) block↔station links; all should be explained.`,
    `6. \`qc.md\` — exclusion reasons; spot-check locations in the dashboard crop-qc admin views (acceptance gate).`,
    `7. \`crops.md\` — per-crop water ranges and maturity/day spreads.`,
    `8. \`../sql/mw-epa-prod-upsert.sql\` — the prod artifact (idempotent upserts).`,
    ``,
    `## Pipeline decisions (encoded, not configurable)`,
    ``,
    `- Water rounded to nearest 5 mm (dashboard prod convention); spreadsheet float artifacts removed.`,
    `- \`water == 0\`/blank rows skipped (perennial cassava/banana carry no seasonal requirement).`,
    `- Blank crops forward-filled within block; variety lists split with the shared extractor.`,
    `- Duplicate blocks: modal days win; >20% water spreads keep the nearest-EPA-station value (logged).`,
    `- Stations prefer climate-data-bearing siblings (e.g. \`dedza_met\` over \`dedza\`); coordinates break ties ≤100 km.`,
    `- Slugs never invented: ${audit.unmappedBlocks.length} blocks and ${audit.orphanEpas.length} canonical EPAs have no data by design.`,
    ``,
    `Regenerate everything: \`yarn scripts picsa/crop-probability/mw-consultant/import-mw-epa-water-requirements\``,
    `Raw per-district JSON: \`intermediates/blocks/\` (+ typed \`index.ts\`). Full machine audit: \`intermediates/mw-epa-audit.json\`.`,
  ]);

  await write('crops.md', [
    `# Per-crop water requirements and maturity spreads`,
    ``,
    `Water in mm (rounded to 5). Days ranges and maturities as stated per block; the`,
    `variety definition keeps the modal days across occurrences.`,
    ``,
    `| Crop | Varieties | Occurrences | Water min–max | Days ranges | Maturities |`,
    `|------|-----------|-------------|---------------|-------------|------------|`,
    ...(audit.cropSummary ?? []).map(
      (c: {
        crop: string;
        varieties: number;
        occurrences: number;
        water_min: number;
        water_max: number;
        days_ranges: string[];
        maturities: string[];
      }) =>
        `| ${c.crop} | ${c.varieties} | ${c.occurrences} | ${c.water_min}–${c.water_max} | ${c.days_ranges.join(', ')} | ${c.maturities.join(', ')} |`,
    ),
    ``,
    `Unmapped crop names (skipped, no ICropName): ${
      Object.entries(audit.unmappedCrops ?? {})
        .map(([k, v]) => `${k} (${v})`)
        .join(', ') || 'none'
    }.`,
    `Zero/blank water rows skipped: ${
      Object.entries(audit.zeroWaterByCrop ?? {})
        .map(([k, v]) => `${k} (${v})`)
        .join(', ') || 'none'
    }.`,
  ]);

  await write('coverage.md', [
    `# Coverage — what was not imported and why`,
    ``,
    `Block → consultant EPA name → nearest canonical EPA (haversine to EPA centroid; point-in-polygon from the geo thread is authoritative, not this distance) → geo verdict.`,
    `Coordinates flagged SUSPECT are known xlsx typos (Kabwazi/Mtubwi missing minus signs, Baka swapped lat/lon — repaired at parse, see log — Madise -11.25 left as-is).`,
    `Every block without a mapping has a verdict in \`unmapped-verdicts.ts\` (MAP = applied per geo point-in-polygon, MISSING = no EPA there, CORRECTLY-UNMAPPED = not an EPA); the parser throws if a verdict is missing or stale.`,
    ``,
    `Canonical set is 2013 vintage (MASDAP catalogue Nov 2013; 2016 Field Diary counts 203 EPAs nationally, ~17 newer EPAs missing — e.g. Chiluwa EPA Salima, Salima 7-vs-4). Orphans below are coverage gaps, not stale entries.`,
    ``,
    `| Block | Consultant EPA | Coords | Nearest canonical (km) | In-district nearest | Verdict | Mapped EPA | Geo rationale |`,
    `|-------|----------------|--------|------------------------|---------------------|---------|------------|---------------|`,
    ...(audit.unmappedTracking ?? []).map(
      (t: {
        block: string;
        consultantEpa: string;
        coords: string;
        nearestCanonicalEpa: { id: string; km: number } | null;
        nearestInSheetDistrict: { id: string; km: number } | null;
        verdict: string;
        mappedEpa: string | null;
        rationale: string;
      }) =>
        `| ${t.block} | ${t.consultantEpa} | ${t.coords} | ${t.nearestCanonicalEpa ? `${t.nearestCanonicalEpa.id} (${t.nearestCanonicalEpa.km})` : '-'} | ${t.nearestInSheetDistrict ? `${t.nearestInSheetDistrict.id} (${t.nearestInSheetDistrict.km})` : '-'} | ${t.verdict} | ${t.mappedEpa ?? '-'} | ${t.rationale} |`,
    ),
    ``,
    `## Canonical EPAs with no consultant data (${(audit.orphanEpas ?? []).length} orphans by design)`,
    ``,
    `| District | EPA ids |`,
    `|----------|---------|`,
    ...(audit.orphansByDistrict ?? []).map(
      (d: { district: string; ids: string[] }) => `| ${d.district} | ${d.ids.join(', ')} |`,
    ),
  ]);

  const nearestEpa = (audit.waterConflicts ?? []).filter((c: { strategy: string }) => c.strategy === 'nearest-epa');
  const modalDays = (audit.waterConflicts ?? []).filter((c: { strategy: string }) => c.strategy === 'modal-days');
  const changed = (audit.varietyOverlap ?? []).filter((v: { changed: boolean }) => v.changed);
  await write('water.md', [
    `# Duplicate-block disagreements and definition changes`,
    ``,
    `## Water conflicts (${nearestEpa.length} kept nearest-EPA value; ${modalDays.length} aligned to modal days)`,
    ``,
    `Only >20% spreads across duplicate blocks are listed — tighter spreads use the mean.`,
    ``,
    `| Location | Crop | Variety | Samples (mm @ block) | Kept |`,
    `|----------|------|---------|---------------------|------|`,
    ...nearestEpa.map(
      (c: {
        location_id: string;
        crop: string;
        variety: string;
        samples: { water: number; blockKey: string }[];
        chosen: number;
      }) =>
        `| ${c.location_id} | ${c.crop} | ${c.variety} | ${c.samples.map((s) => `${s.water}@${s.blockKey}`).join(', ')} | ${c.chosen} |`,
    ),
    ``,
    `## Variety definitions overwriting shared ids (${changed.length} with changed days)`,
    ``,
    `IDs are global (\`crop/variety\`); changed days also affect other countries sharing the id on re-sync.`,
    ``,
    `| Crop | Variety | Existing days | New days |`,
    `|------|---------|---------------|----------|`,
    ...changed.map(
      (v: { crop: string; variety: string; existing_days: string; new_days: string }) =>
        `| ${v.crop} | ${v.variety} | ${v.existing_days} | ${v.new_days} |`,
    ),
  ]);

  const byMethod: Record<string, number> = {};
  for (const r of audit.stationResolutions ?? []) byMethod[r.method] = (byMethod[r.method] ?? 0) + 1;
  const far = (audit.stationResolutions ?? []).filter((r: { detail: string }) => {
    const m = /(\d+\.\d+) km/.exec(r.detail);
    return m && parseFloat(m[1]) > 50;
  });
  const flagged = (audit.varietyLedger ?? [])
    .filter((v: { flags: string[] }) => v.flags.length > 0)
    .map((v: { maturities: string[]; observedDays: string[] }) => {
      // Rank genuine disagreements above row-level singletons: minority share of
      // maturity/day mentions (e.g. cotton MAKOKA-2000 6/6 vs a single stray cell).
      const counts = [...v.maturities, ...v.observedDays].map(
        (s: string) => parseInt((s.split('(x')[1] ?? '0').replace(')', ''), 10) || 0,
      );
      const total = counts.reduce((a: number, b: number) => a + b, 0);
      return { v, minorityShare: total > 0 ? (total - Math.max(...counts)) / total : 0 };
    })
    .sort((a, b) => b.minorityShare - a.minorityShare)
    .map(({ v }) => v);
  const byCropLedger = (audit.varietyLedger ?? []).reduce(
    (
      m: Record<
        string,
        {
          crop: string;
          variety: string;
          defDays: string;
          observedDays: string[];
          waterMin: number;
          waterMax: number;
          blocks: number;
        }[]
      >,
      v: {
        crop: string;
        variety: string;
        defDays: string;
        observedDays: string[];
        waterMin: number;
        waterMax: number;
        blocks: number;
      },
    ) => {
      (m[v.crop] ??= []).push(v);
      return m;
    },
    {},
  );
  await write('varieties.md', [
    `# Per-variety consistency — maturity and days should be static, only water varies`,
    ``,
    `**${flagged.length} of ${(audit.varietyLedger ?? []).length} varieties flagged** (MULTI_DAYS and/or MULTI_MATURITY). Variety definitions keep the modal days; water merges prefer the definition-days group.`,
    ``,
    `## Flagged varieties`,
    ``,
    `| Crop | Variety | Def days | Observed days | Maturities | Water min–max (median) | Blocks | Flags |`,
    `|------|---------|----------|---------------|------------|------------------------|--------|-------|`,
    ...flagged.map(
      (v: {
        crop: string;
        variety: string;
        defDays: string;
        observedDays: string[];
        maturities: string[];
        waterMin: number;
        waterMax: number;
        waterMedian: number;
        blocks: number;
        flags: string[];
      }) =>
        `| ${v.crop} | ${v.variety} | ${v.defDays} | ${v.observedDays.join(', ')} | ${v.maturities.join(', ')} | ${v.waterMin}–${v.waterMax} (${v.waterMedian}) | ${v.blocks} | ${v.flags.join('+')} |`,
    ),
    ``,
    `## All varieties by crop`,
    ...Object.entries(byCropLedger).flatMap(
      ([crop, vs]: [
        string,
        {
          variety: string;
          defDays: string;
          observedDays: string[];
          waterMin: number;
          waterMax: number;
          blocks: number;
        }[],
      ]) => [
        ``,
        `### ${crop} (${vs.length} varieties)`,
        ``,
        `| Variety | Def days | Observed days | Water min–max | Blocks |`,
        `|---------|----------|---------------|---------------|--------|`,
        ...vs.map(
          (v) =>
            `| ${v.variety} | ${v.defDays} | ${v.observedDays.join(', ')} | ${v.waterMin}–${v.waterMax} | ${v.blocks} |`,
        ),
      ],
    ),
  ]);

  await write('outliers.md', [
    `# Water-requirement outliers within crop groups (raw ledger values)`,
    ``,
    `Bounds per crop: outside Q1−3·IQR / Q3+3·IQR. "Merged" notes where the duplicate-block merge already resolved the sample (nearest-EPA value kept); the raw value below is still flagged for source review with its originating block.`,
    ``,
    `| Crop | Variety | Water (mm) | Crop median | Days | Block (source ref) | Merge resolution |`,
    `|------|---------|------------|-------------|------|--------------------|------------------|`,
    ...(audit.outliers ?? []).map(
      (o: {
        crop: string;
        variety: string;
        water: number;
        cropMedian: number;
        days: string;
        block: string;
        resolvedByMerge: boolean;
      }) =>
        `| ${o.crop} | ${o.variety} | ${o.water} | ${o.cropMedian} | ${o.days} | ${o.block} | ${o.resolvedByMerge ? 'resolved (nearest-EPA kept)' : 'as stored'} |`,
    ),
  ]);

  await write('stations.md', [
    `# Station linkage — methods and far links`,
    ``,
    `Resolution methods: ${Object.entries(byMethod)
      .map(([k, v]) => `${k} (${v})`)
      .join(', ')}.`,
    `Unresolved: ${(audit.unresolvedStations ?? []).length}. Full per-block log: \`intermediates/mw-epa-audit.json\`.`,
    ``,
    `## Block↔station links over 50 km (${far.length} — all explained)`,
    ``,
    `Long links are either docx-directed cross-district mappings or source coordinate`,
    `typos in the xlsx (Kabwazi/Mtubwi latitudes missing minus signs; Madise -11.25).`,
    `Name matches were verified against false positives (e.g. CHILEKA AIRPORT for a`,
    `Chileka block) and rerouted to the nearest station with data.`,
    ``,
    `| Block | Link |`,
    `|-------|------|`,
    ...far.map((r: { blockKey: string; detail: string }) => `| ${r.blockKey} | ${r.detail} |`),
  ]);

  const groups: Record<string, { count: number; locations: Set<string> }> = {};
  for (const s of audit.qc.summaries ?? []) {
    for (const e of s.exclusions ?? []) {
      const code = (e.failures ?? []).map((f: { code: string }) => f.code).join('+') || 'unknown';
      const k = `${e.crop} ${code}`;
      groups[k] ??= { count: 0, locations: new Set() };
      groups[k].count++;
      groups[k].locations.add(s.location_id);
    }
  }
  await write('qc.md', [
    `# QC exclusions (ENFORCE_LOOKUP_BOUNDS)`,
    ``,
    `Included=${audit.qc.included} excluded=${audit.qc.excluded} across ${audit.locations} locations;`,
    `${audit.qc.skippedLocations} locations skipped (no station data). Excluded varieties stay in`,
    `\`water_requirements\` but are omitted from generated tables.`,
    ``,
    `## Exclusions grouped by cause`,
    ``,
    `| Crop + cause | Entries | Locations |`,
    `|--------------|---------|-----------|`,
    ...Object.entries(groups)
      .sort((a, b) => b[1].count - a[1].count)
      .map(
        ([k, v]) =>
          `| ${k} | ${v.count} | ${[...v.locations].slice(0, 8).join(', ')}${v.locations.size > 8 ? '…' : ''} |`,
      ),
    ``,
    `## Per-location counts`,
    ``,
    `| Location | Station | Included | Excluded |`,
    `|----------|---------|----------|----------|`,
    ...(audit.qc.summaries ?? []).map(
      (s: { location_id: string; station_id: string; included?: number; excluded?: number; reason?: string }) =>
        `| ${s.location_id} | ${s.station_id} | ${s.included ?? '-'} | ${s.excluded ?? s.reason ?? '-'} |`,
    ),
  ]);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => {
  console.error('[MW EPA import failed]:', err);
  process.exit(1);
});
