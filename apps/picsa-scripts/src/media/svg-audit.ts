/**
 * SVG Usage Audit
 *
 * For every SVG that lands in the app bundle via apps/picsa-apps/app/project.json
 * asset globs, determine which tools/routes consume it:
 *  - static literal references (`assets/.../*.svg` in .ts/.html)
 *  - runtime asset-path lookups (budget-cards/${id}, crop_activity/${id}, etc.)
 *  - mat-icon registries (DataIconRegistry, budget/option/manual material modules)
 *  - deployment seed-data image IDs (countries/locales flag_path)
 *  - forecast/resource cover references
 *
 * Reports:
 *  - dead/unreferenced files (no static or ID-derived consumer)
 *  - byte-identical duplicates (double-shipped via two sources or two outputs)
 *  - ambiguous dynamic-ID cases flagged for human decision (never auto-deleted)
 *
 * Usage:
 *   yarn scripts media/svg-audit [--json] [--markdown]
 *
 * Outputs (always written):
 *   apps/picsa-scripts/src/media/svg-audit-report.json
 *   apps/picsa-scripts/src/media/svg-audit-report.md
 */
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '../../../../');
const APP_PROJECT_JSON = path.join(ROOT_DIR, 'apps/picsa-apps/app/project.json');
const REPORT_JSON = path.join(__dirname, 'svg-audit-report.json');
const REPORT_MD = path.join(__dirname, 'svg-audit-report.md');

interface AssetEntry {
  glob?: string;
  input?: string;
  output?: string;
  ignore?: string[];
}

interface SvgRecord {
  source: string;
  size: number;
  hash: string;
  bundleOutputs: string[];
  consumers: string[];
  status: 'live' | 'dead' | 'ambiguous';
  duplicateGroup?: string;
}

function listSvgFiles(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSvgFiles(full));
    } else if (entry.name.toLowerCase().endsWith('.svg')) {
      out.push(full);
    }
  }
  return out;
}

function sha256(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return createHash('sha256').update(data).digest('hex');
}

function loadAssetEntries(): AssetEntry[] {
  const project = JSON.parse(fs.readFileSync(APP_PROJECT_JSON, 'utf8'));
  const assets: AssetEntry[] = project.targets?.build?.options?.assets ?? [];
  // Only entries that can carry SVGs into the bundle
  return assets.filter((a) => typeof a === 'string' || a.glob || a.input);
}

function expandAssetOutputs(): Map<string, string[]> {
  // source-relative-path -> bundle output paths
  const map = new Map<string, string[]>();
  const entries = loadAssetEntries();
  for (const entry of entries) {
    if (typeof entry === 'string') continue;
    if (!entry.input || !entry.glob) continue;
    const inputDir = path.join(ROOT_DIR, entry.input);
    if (!fs.existsSync(inputDir)) continue;
    const files = listSvgFiles(inputDir);
    for (const file of files) {
      const rel = path.relative(ROOT_DIR, file);
      // Simplified glob handling: **/*, *.svg, *, {..} patterns all match .svg here
      // since we already filtered to .svg files under input.
      const relFromInput = path.relative(inputDir, file);
      // Respect ignore patterns (only favicon-style substring ignores needed)
      if (entry.ignore?.some((ig) => rel.includes(ig.replace(/\*/g, '')))) continue;
      const outputPath = path.posix.join(entry.output ?? '', ...relFromInput.split(path.sep));
      const list = map.get(rel) ?? [];
      list.push(outputPath);
      map.set(rel, list);
    }
  }
  return map;
}

function collectLiteralRefs(): Set<string> {
  // Scan for literal `assets/...svg` strings in code
  const refs = new Set<string>();
  const roots = ['apps', 'libs'];
  const pattern = /assets\/[A-Za-z0-9_\-./]+\.svg/g;
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(ts|html)$/.test(entry.name) && !entry.name.endsWith('.spec.ts')) {
        const content = fs.readFileSync(full, 'utf8');
        for (const m of content.match(pattern) ?? []) {
          refs.add(m);
        }
      }
    }
  };
  for (const r of roots) walk(path.join(ROOT_DIR, r));
  return refs;
}

function extractIds(fileRel: string, idPattern: RegExp): Set<string> {
  const full = path.join(ROOT_DIR, fileRel);
  if (!fs.existsSync(full)) return new Set();
  const content = fs.readFileSync(full, 'utf8');
  const ids = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(idPattern, 'g');
  while ((m = re.exec(content)) !== null) {
    ids.add(m[1]);
  }
  return ids;
}

function buildIdToBundleMap(): Map<string, string[]> {
  // bundle asset path -> list of consumer descriptions
  const map = new Map<string, string[]>();
  const add = (bundlePath: string, consumer: string) => {
    const list = map.get(bundlePath) ?? [];
    list.push(consumer);
    map.set(bundlePath, list);
  };

  // 1. CROPS: assets/svgs/crops/${id}.svg (26 named)
  const cropsBase = path.join(ROOT_DIR, 'libs/data/crops/index.ts');
  if (fs.existsSync(cropsBase)) {
    const content = fs.readFileSync(cropsBase, 'utf8');
    for (const m of content.matchAll(/['"]([a-z0-9-]+)['"]\s*:\s*\{\s*label/g)) {
      add(`assets/svgs/crops/${m[1]}.svg`, 'libs/data/crops CROPS_DATA_BASE');
    }
  }

  // 2. Enterprise budget cards that resolve via crops dual-glob to assets/budget-cards
  const enterpriseIds = extractIds(
    'apps/picsa-tools/budget-tool/src/app/data/cards/enterprises.ts',
    /id:\s*['"]([^'"]+)['"]/g,
  );
  for (const id of enterpriseIds) {
    add(`assets/budget-cards/${id}.svg`, 'budget-tool ENTERPRISE_CARDS (via crops dual-glob or budget-cards)');
  }

  // 3. BUDGET_CARDS static ids (svg only meaningful, but map all for ambiguity flagging)
  const budgetCardsContent =
    (fs.existsSync(path.join(ROOT_DIR, 'apps/picsa-tools/budget-tool/src/app/data/cards/index.ts'))
      ? fs.readFileSync(path.join(ROOT_DIR, 'apps/picsa-tools/budget-tool/src/app/data/cards/index.ts'), 'utf8')
      : '') +
    (fs.existsSync(path.join(ROOT_DIR, 'apps/picsa-tools/budget-tool/src/app/data/cards/enterprises.ts'))
      ? fs.readFileSync(path.join(ROOT_DIR, 'apps/picsa-tools/budget-tool/src/app/data/cards/enterprises.ts'), 'utf8')
      : '');
  for (const m of budgetCardsContent.matchAll(/id:\s*['"]([^'"]+)['"]/g)) {
    add(`assets/budget-cards/${m[1]}.svg`, 'budget-tool BUDGET_CARDS id');
    add(`assets/budget-cards/${m[1]}.png`, 'budget-tool BUDGET_CARDS id (png variant)');
  }
  // imgId overrides: wood_input->wood, money_input->money
  add('assets/budget-cards/wood.svg', 'budget-tool imgId override (wood_input)');
  add('assets/budget-cards/money.svg', 'budget-tool imgId override (money_input)');
  // family-labour gender variants via template string
  add('assets/budget-cards/family-labour_adultFemale.svg', 'budget-table.html static img');
  add('assets/budget-cards/family-labour_adultMale.svg', 'budget-table.html static img');
  // NOTE: budget-card-image.ts loads `assets/budget-cards/${imageId}.${imageType}` dynamically.
  // Known ID universe is BUDGET_CARDS ids + imgId overrides above (exhaustively mapped).
  // Any budget-cards file NOT in that set is dead (no ambiguous wildcard match).

  // 4. Crop activity: assets/svgs/crop_activity/${id}.svg (+ .png HACK variants)
  // NOTE: pngIcon entries use .png, not .svg — only .svg IDs mapped here are live.
  const cropActivityBase = path.join(ROOT_DIR, 'libs/data/crop_activity/index.ts');
  if (fs.existsSync(cropActivityBase)) {
    const content = fs.readFileSync(cropActivityBase, 'utf8');
    for (const m of content.matchAll(/^\s*([a-z_]+):\s*\{/gm)) {
      add(`assets/svgs/crop_activity/${m[1]}.svg`, 'libs/data/crop_activity CROP_ACTIVITY_BASE');
    }
  }

  // 5. Weather / tools / farmer_content via DataIconRegistry
  for (const id of [
    'clear',
    'cloudy',
    'rain_low',
    'rain_medium',
    'rain_high',
    'rain_low_label',
    'rain_medium_label',
    'rain_high_label',
  ]) {
    add(`assets/svgs/weather/${id}.svg`, 'libs/data/weather WEATHER_DATA');
  }
  const toolsIds = [
    'budget',
    'climate',
    'crop_probability',
    'farmer',
    'forecasts',
    'option',
    'manual',
    'resources',
    'seasonal_calendar',
  ];
  for (const id of toolsIds) add(`assets/svgs/tools/${id}.svg`, 'libs/data/tools TOOLS_DATA');
  add(
    'assets/svgs/tools/discussions.svg',
    'AMBIGUOUS: no TOOLS_DATA entry, only commented extension-content ref (likely dead)',
  );
  const farmerIds = [
    '0_intro',
    '1_what_you_do',
    '2_climate_change',
    '3_opportunities_risks',
    '4_what_are_the_options',
    '5_compare_options',
    '6_decide_and_plan',
    '7_use_forecasts',
    '8_beyond_picsa',
  ];
  for (const id of farmerIds)
    add(`assets/svgs/farmer_content/${id}.svg`, 'libs/data/farmer_content FARMER_CONTENT_DATA');

  // 6. Climate icons (only chart_definitions entries are live; rest ambiguous for human)
  for (const m of [
    'season-rainfall',
    'season-start',
    'season-end',
    'season-length',
    'extreme-rainfall',
    'temp_min',
    'temp_max',
  ]) {
    add(`assets/climate-icons/${m}.svg`, 'libs/data/climate chart_definitions');
  }
  for (const m of ['crop-analysis', 'extreme-heat', 'extreme-drought', 'combined-risk', 'temperatures']) {
    add(
      `assets/climate-icons/${m}.svg`,
      'AMBIGUOUS: climate-icons not in chart_definitions - flag for human (likely dead, verify templates)',
    );
  }

  // 7. Flags (known country set; xx demo hidden but file may exist)
  for (const f of ['mw', 'zm', 'zw', 'global', 'ke', 'gb', 'tj', 'xx']) {
    add(`assets/images/flags/${f}.svg`, 'libs/data/deployments countries/locales flag_path');
  }

  // 8. Option-tool enterprises (static images)
  add('assets/svgs/crop-enterprise.svg', 'option-tool ENTERPRISE_DATA static image');
  add('assets/svgs/livestock-enterprise.svg', 'option-tool ENTERPRISE_DATA static image');
  add('assets/svgs/livelihood-enterprise.svg', 'option-tool ENTERPRISE_DATA static image');
  // Option-tool mat-icons (close, female, male, risks) -> assets/svgs/${icon}.svg
  for (const icon of ['close', 'female', 'male', 'risks']) {
    add(`assets/svgs/${icon}.svg`, 'option-tool OptionMaterialModule mat-icon');
  }

  // 9. Manual-tool mat-icons (mapped values)
  const manualMap: Record<string, string> = {
    calendar: 'calendar',
    campus: 'campus',
    crop: 'crop',
    livestock: 'livestock',
    resource_allocation: 'resourceAllocation',
    temperature: 'temperature',
    place_holder: 'place_holder',
    info: 'info',
    create: 'create',
    quiz: 'quiz',
  };
  for (const value of Object.values(manualMap)) {
    add(`assets/svgs/${value}.svg`, 'manual-tool ManualToolMaterialModule mat-icon');
  }

  // 10. Budget-tool mat-icons for custom svgs
  for (const id of ['cash_balance', 'family', 'inputs', 'outputs']) {
    add(`assets/svgs/${id}.svg`, 'budget-tool BudgetMaterialModule custom svgs');
  }
  add(
    'assets/svgs/family-labour.svg',
    'AMBIGUOUS: budget-summary references picsa_budget_family-labour but material registers family (no -labour); file exists in budget-cards, check runtime',
  );

  // 11. Forecasts (only seasonal/downscaled resolve to image; daily/weekly use label)
  add('assets/svgs/forecast_seasonal.svg', 'forecasts-tool forecast.page forecast_seasonal');
  add('assets/svgs/forecast_downscaled.svg', 'forecasts-tool forecast.page forecast_downscaled');

  // 12b. Favicon is live via index.html root hrefs (not via assets/ path)
  add('favicon.svg', 'app index.html /favicon.svg');
  add('favicon-dark.svg', 'app index.html /favicon-dark.svg');
  add('favicon.ico', 'app index.html /favicon.ico');

  // 12. Resources covers + mat-icons
  for (const c of [
    'whatsapp.svg',
    'facebook.svg',
    'crops.svg',
    'weather.svg',
    'spreadsheet.svg',
    'gender-equality.svg',
    'gender-equality-1.svg',
    'videos.svg',
  ]) {
    add(`assets/resources/covers/${c}`, 'resources-tool covers / climate resources');
  }
  for (const m of ['filetype_video.svg', 'filetype_pdf.svg', 'filetype_document.svg', 'play_store.svg']) {
    add(`assets/resources/mat-icons/${m}`, 'resources-tool material.module mat-icons');
  }

  // 13. Climate-tool svgs
  for (const t of ['la-nina-tool', 'line-tool', 'trendline-tool', 'tercile-tool', 'el-nina-tool']) {
    add(`assets/climate-tools/${t}.svg`, 'climate-tool assets (static tool icons)');
  }

  // 14. Budget-icons + budget svgs
  for (const b of [
    'budget-create',
    'budget-import',
    'share-mobile',
    'share-image',
    'dot-small',
    'dot-medium',
    'dot-large',
  ]) {
    add(`assets/budget-icons/${b}.svg`, 'budget-tool budget-icons (check templates)');
  }

  return map;
}

async function main() {
  const outputs = expandAssetOutputs();
  // Exclude out-of-scope pdf-viewer vendor assets (manuals + pdf.js stay offline, untouched)
  for (const key of [...outputs.keys()]) {
    if (key.startsWith('node_modules/')) outputs.delete(key);
  }
  const literals = collectLiteralRefs();
  const idMap = buildIdToBundleMap();
  // Source-imported SVGs (not via bundle asset path) still count as live usage
  const importedSvgs = new Set<string>();
  {
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|html)$/.test(entry.name) && !entry.name.endsWith('.spec.ts')) {
          const content = fs.readFileSync(full, 'utf8');
          for (const m of content.matchAll(/from\s+['"]([^'"]+\.svg)['"]/g)) {
            importedSvgs.add(m[1]);
          }
        }
      }
    };
    walk(path.join(ROOT_DIR, 'libs'));
    walk(path.join(ROOT_DIR, 'apps'));
  }

  const records: SvgRecord[] = [];
  const hashGroups = new Map<string, string[]>();

  for (const [rel, bundleOutputs] of [...outputs.entries()].sort()) {
    const full = path.join(ROOT_DIR, rel);
    const size = fs.statSync(full).size;
    const hash = sha256(full);
    const group = hashGroups.get(hash) ?? [];
    group.push(rel);
    hashGroups.set(hash, group);

    const consumers = new Set<string>();
    for (const out of bundleOutputs) {
      if (literals.has(out)) consumers.add(`static literal \`${out}\``);
      const mapped = idMap.get(out);
      if (mapped) for (const c of mapped) consumers.add(c);
    }
    // Favicon root outputs + source imports
    if (rel.includes('shared-assets/favicon')) {
      consumers.add('app index.html root favicon (live, second assets/ copy is dead double-emit)');
    }
    for (const imp of importedSvgs) {
      if (rel.endsWith(path.basename(imp)) || imp.includes(path.basename(rel))) {
        consumers.add(`source-imported \`${imp}\` (live via bundler, not asset path)`);
      }
    }

    // Flag shared-assets images with zero consumers as dead (they have no ID mapping)
    let status: SvgRecord['status'] = consumers.size > 0 ? 'live' : 'dead';
    // Any consumer containing AMBIGUOUS forces ambiguous status for human review
    if ([...consumers].some((c) => c.startsWith('AMBIGUOUS'))) status = 'ambiguous';

    records.push({ source: rel, size, hash, bundleOutputs, consumers: [...consumers].sort(), status });
  }

  // Attach duplicate group ids
  let dupGroupCount = 0;
  for (const [, group] of hashGroups) {
    if (group.length > 1) {
      dupGroupCount++;
      const gid = `dup-${dupGroupCount}`;
      for (const rel of group) {
        const rec = records.find((r) => r.source === rel);
        if (rec) rec.duplicateGroup = gid;
      }
    }
  }

  const totalBytes = records.reduce((s, r) => s + r.size, 0);
  const dead = records.filter((r) => r.status === 'dead');
  const ambiguous = records.filter((r) => r.status === 'ambiguous');
  const deadBytes = dead.reduce((s, r) => s + r.size, 0);

  const report = {
    generated: new Date().toISOString(),
    root: ROOT_DIR,
    totals: {
      svgFilesInBundle: records.length,
      totalBytes,
      deadFiles: dead.length,
      deadBytes,
      ambiguousFiles: ambiguous.length,
      duplicateGroups: dupGroupCount,
    },
    assetGlobs: loadAssetEntries(),
    records,
    duplicateGroups: [...hashGroups.entries()]
      .filter(([, g]) => g.length > 1)
      .map(([hash, files]) => ({ hash, files })),
  };

  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  // Markdown
  const fmt = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`);
  let md = `# SVG Audit Report\n\nGenerated: ${report.generated}\n\n`;
  md += `## Totals\n\n- SVGs in app bundle: **${records.length}** (${fmt(totalBytes)})\n`;
  md += `- Dead/unreferenced: **${dead.length}** (${fmt(deadBytes)})\n`;
  md += `- Ambiguous (human review): **${ambiguous.length}**\n`;
  md += `- Byte-identical duplicate groups: **${dupGroupCount}**\n\n`;
  md += `## Asset globs (apps/picsa-apps/app/project.json)\n\n`;
  for (const a of report.assetGlobs as AssetEntry[]) {
    if (typeof a === 'string') md += `- \`${a}\`\n`;
    else
      md += `- glob \`${a.glob}\` input \`${a.input}\` -> output \`${a.output}\`${a.ignore ? ` ignore \`${a.ignore}\`` : ''}\n`;
  }
  md += `\n## Duplicate groups (verify before dedupe)\n\n`;
  for (const g of report.duplicateGroups as { hash: string; files: string[] }[]) {
    const size = fs.statSync(path.join(ROOT_DIR, g.files[0])).size;
    md += `### ${g.hash.slice(0, 8)} (${fmt(size)} x${g.files.length})\n`;
    for (const f of g.files.sort()) md += `- \`${f}\`\n`;
    md += `\n`;
  }
  md += `## Dead files (no static or ID-derived consumer found)\n\n`;
  md += `> Do not delete without human review of the "ambiguous" dynamic-ID cases below.\n\n`;
  for (const r of dead.sort((a, b) => b.size - a.size)) {
    md += `- \`${r.source}\` (${fmt(r.size)}) -> ${r.bundleOutputs.map((o) => `\`${o}\``).join(', ')}${r.duplicateGroup ? ` [${r.duplicateGroup}]` : ''}\n`;
  }
  md += `\n## Ambiguous dynamic-ID cases (human decision required)\n\n`;
  for (const r of ambiguous.sort((a, b) => b.size - a.size)) {
    md += `- \`${r.source}\` -> ${r.bundleOutputs.join(', ')}\n`;
    for (const c of r.consumers) md += `  - ${c}\n`;
  }
  md += `\n## Live files (sample)\n\n`;
  md += `Full consumer mapping is in \`svg-audit-report.json\`. ${records.length - dead.length - ambiguous.length} live files.\n`;
  fs.writeFileSync(REPORT_MD, md);

  console.log(`SVG audit: ${records.length} files, ${fmt(totalBytes)} total`);
  console.log(
    `Dead: ${dead.length} files (${fmt(deadBytes)}), Ambiguous: ${ambiguous.length}, Duplicate groups: ${dupGroupCount}`,
  );
  console.log(`Wrote ${REPORT_JSON}`);
  console.log(`Wrote ${REPORT_MD}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('SVG audit failed:', err);
    process.exit(1);
  });
}

export { main as svgAudit };
