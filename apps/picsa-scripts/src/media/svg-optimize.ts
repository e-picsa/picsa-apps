/**
 * SVG Optimizer (SVGO bulk pass)
 *
 * Runs SVGO with repo-standard config over all app-bundle SVG sources:
 *   { multipass: true, plugins: [{ name: 'preset-default', params: { overrides: { removeViewBox: false } } }] }
 *
 * Guarantees:
 *  - viewBox preserved everywhere (override above + post-check)
 *  - no empty/broken outputs (size > 0, starts with <svg)
 *  - before/after byte counts per group (printed + written to svg-optimize-report.json)
 *
 * Usage:
 *   yarn scripts media/svg-optimize            # optimize in place + report
 *   yarn scripts media/svg-optimize --check    # dry-run, report only, write nothing
 *
 * Roots covered (union of app-bundle SVG inputs from project.json):
 *   libs/data, libs/shared-assets, apps picsa-tools tool assets
 * Extension-content is excluded (not in app bundle).
 */
import * as fs from 'fs';
import * as path from 'path';
import { optimize } from 'svgo';

import { formatBytes } from './image-optimizer';
import { SVGO_CONFIG } from './svgo.config';

const ROOT_DIR = path.resolve(__dirname, '../../../../');
const REPORT_JSON = path.join(__dirname, 'svg-optimize-report.json');

const SVG_ROOTS = [
  'libs/data/crops/svgs',
  'libs/data/crop_activity/svgs',
  'libs/data/weather/svgs',
  'libs/data/farmer_content/svgs',
  'libs/data/tools/svgs',
  'libs/data/climate/climate-icons',
  'libs/shared-assets',
  'apps/picsa-tools/budget-tool/src/assets',
  'apps/picsa-tools/climate-tool/src/assets',
  'apps/picsa-tools/option-tool/src/assets',
  'apps/picsa-tools/resources-tool/src/assets',
  'apps/picsa-tools/forecasts-tool/src/assets',
  'apps/picsa-tools/manual-tool/src/assets',
  'apps/picsa-tools/seasonal-calendar-tool/src/assets',
];

function listSvgFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.toLowerCase().endsWith('.svg')) out.push(full);
    }
  };
  for (const rel of SVG_ROOTS) walk(path.join(ROOT_DIR, rel));
  return out.sort();
}

function groupOf(file: string): string {
  const rel = path.relative(ROOT_DIR, file);
  if (rel.startsWith('libs/data/crops/')) return 'crops';
  if (rel.startsWith('libs/data/crop_activity/')) return 'crop_activity';
  if (rel.startsWith('libs/data/weather/')) return 'weather';
  if (rel.startsWith('libs/data/farmer_content/')) return 'farmer_content';
  if (rel.startsWith('libs/data/tools/')) return 'tools';
  if (rel.startsWith('libs/data/climate/')) return 'climate-icons';
  if (rel.startsWith('libs/shared-assets/')) return 'shared-assets';
  if (rel.startsWith('apps/picsa-tools/budget-tool/')) return 'budget-tool';
  if (rel.startsWith('apps/picsa-tools/climate-tool/')) return 'climate-tool';
  if (rel.startsWith('apps/picsa-tools/option-tool/')) return 'option-tool';
  if (rel.startsWith('apps/picsa-tools/resources-tool/')) return 'resources-tool';
  if (rel.startsWith('apps/picsa-tools/forecasts-tool/')) return 'forecasts-tool';
  if (rel.startsWith('apps/picsa-tools/manual-tool/')) return 'manual-tool';
  return 'other';
}

async function main() {
  const checkOnly = process.argv.includes('--check') || process.env.SVG_CHECK === '1';
  const files = listSvgFiles();
  console.log(`SVGO pass over ${files.length} SVGs (checkOnly=${checkOnly})`);

  let totalBefore = 0;
  let totalAfter = 0;
  const perGroup = new Map<string, { files: number; before: number; after: number }>();
  const perFile: { file: string; before: number; after: number; viewBoxBefore: boolean; viewBoxAfter: boolean }[] = [];
  const failures: string[] = [];

  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    const before = Buffer.byteLength(original);
    const viewBoxBefore = /viewBox\s*=/.test(original);
    totalBefore += before;

    let result: string;
    try {
      const out = optimize(original, { ...SVGO_CONFIG, path: file } as never) as { data: string };
      result = out.data;
    } catch (err) {
      // Keep original on parse failure (e.g. unbound namespace prefixes); report but do not fail.
      // Fix the source manually (strip non-rendering inkscape: attrs) and re-run.
      failures.push(`${path.relative(ROOT_DIR, file)}: SVGO threw ${(err as Error).message} (kept original)`);
      totalAfter += before;
      const gKeep = groupOf(file);
      const entryKeep = perGroup.get(gKeep) ?? { files: 0, before: 0, after: 0 };
      entryKeep.files++;
      entryKeep.before += before;
      entryKeep.after += before;
      perGroup.set(gKeep, entryKeep);
      continue;
    }

    const after = Buffer.byteLength(result);
    const viewBoxAfter = /viewBox\s*=/.test(result);

    // Verification: viewBox preserved, non-empty, valid svg
    if (viewBoxBefore && !viewBoxAfter) {
      failures.push(`${path.relative(ROOT_DIR, file)}: viewBox removed (config violation)`);
    }
    if (after === 0 || !result.includes('<svg')) {
      failures.push(`${path.relative(ROOT_DIR, file)}: empty/broken output (${before} -> ${after})`);
      totalAfter += before;
      continue;
    }

    totalAfter += after;
    const g = groupOf(file);
    const entry = perGroup.get(g) ?? { files: 0, before: 0, after: 0 };
    entry.files++;
    entry.before += before;
    entry.after += after;
    perGroup.set(g, entry);
    perFile.push({ file: path.relative(ROOT_DIR, file), before, after, viewBoxBefore, viewBoxAfter });

    if (!checkOnly && after !== before) {
      fs.writeFileSync(file, result);
    }
  }

  console.log('\nPer-group before/after:');
  for (const [g, v] of [...perGroup.entries()].sort()) {
    const saved = v.before - v.after;
    const pct = v.before ? ((saved / v.before) * 100).toFixed(1) : '0.0';
    console.log(
      `- ${g}: ${v.files} files, ${formatBytes(v.before)} -> ${formatBytes(v.after)} (saved ${formatBytes(saved)}, ${pct}%)`,
    );
  }
  console.log(
    `\nTotal: ${formatBytes(totalBefore)} -> ${formatBytes(totalAfter)} (saved ${formatBytes(totalBefore - totalAfter)})`,
  );

  if (failures.length > 0) {
    console.error(`\n${failures.length} verification failures:`);
    for (const f of failures) console.error(`  ! ${f}`);
    process.exitCode = 1;
  } else {
    console.log('\nVerification: viewBox preserved everywhere, no empty/broken outputs.');
  }

  const report = {
    generated: new Date().toISOString(),
    checkOnly,
    totals: { files: files.length, before: totalBefore, after: checkOnly ? totalBefore : totalAfter },
    perGroup: Object.fromEntries(perGroup),
    perFile: perFile.sort((a, b) => b.before - b.after - (a.before - a.after)),
    failures,
  };
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
  console.log(`Wrote ${REPORT_JSON}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('SVG optimize failed:', err);
    process.exit(1);
  });
}

export { main as svgOptimize };
