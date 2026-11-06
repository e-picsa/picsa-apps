#!/usr/bin/env node
/**
 * AI worktree audit helper.
 *
 * Finds every checkout for this repo across the standard agent tool roots
 * (T3 Code `~/.t3/worktrees/<repo>` and Gemini Antigravity
 * `~/.gemini/antigravity/worktrees/<repo>`), reports sizes, and flags
 * orphaned directories (on disk but unknown to `git worktree list`, or with
 * a broken `.git` pointer). Optional flags perform cleanup.
 *
 * Usage:
 *   yarn ai:worktree:audit                        # report only (default)
 *   yarn ai:worktree:audit --prune                 # + `git worktree prune`
 *   yarn ai:worktree:audit --delete-orphans        # + rm -rf orphaned dirs
 *   yarn ai:worktree:audit --delete-merged         # + remove worktrees merged into main
 *   yarn ai:worktree:audit --clear-node-modules    # + rm -rf node_modules in worktrees (main excluded)
 *   yarn ai:worktree:audit --remove <path...>      # + remove explicit worktree(s)
 *   yarn ai:worktree:audit --roots <a,b,...>       # override scan roots
 *   yarn ai:worktree:audit --json                  # machine-readable report, no actions
 *   yarn ai:worktree:audit --dry-run               # preview destructive actions
 *
 * Destructive flags compose (e.g. `--delete-orphans --clear-node-modules`).
 * `--dry-run` previews without executing. The main checkout is never deleted
 * or stripped. Zero dependencies (node builtins only).
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gitOutput, hasHelpFlag, REPO_ROOT } from './_shared.mjs';

const REPO_NAME = path.basename(REPO_ROOT);
const DEFAULT_ROOTS = [
  path.join(os.homedir(), '.t3', 'worktrees', REPO_NAME),
  path.join(os.homedir(), '.gemini', 'antigravity', 'worktrees', REPO_NAME),
];

function printHelp() {
  console.log(`ai-worktree-audit: audit git worktrees across agent tool roots

Usage:
  yarn ai:worktree:audit [options]

Options:
  --prune                 Run \`git worktree prune\` before auditing
  --delete-orphans        Remove disk dirs unknown to \`git worktree list\`
  --delete-merged         Remove worktrees whose branch is merged into main
  --clear-node-modules    Remove node_modules inside worktrees (main checkout excluded)
  --remove <path...>      Remove explicit worktree path(s)
  --roots <a,b,...>       Override scan roots (default: ${DEFAULT_ROOTS.join(', ')})
  --json                  Print JSON report and skip actions
  --dry-run               Preview destructive actions without executing
  -h, --help              Show this help

Orphans = directory under a scan root that is not listed by
\`git worktree list\`, or whose gitlink is broken (not a git repository).
Merged = worktree branch appears in \`git branch --merged main\`.`);
}

function parseArgs(rawArgs) {
  const opts = {
    prune: false,
    deleteOrphans: false,
    deleteMerged: false,
    clearNodeModules: false,
    json: false,
    dryRun: false,
    roots: null,
    remove: [],
  };
  const args = [...rawArgs];
  while (args.length > 0) {
    const a = args.shift();
    if (a === '--prune') opts.prune = true;
    else if (a === '--delete-orphans') opts.deleteOrphans = true;
    else if (a === '--delete-merged') opts.deleteMerged = true;
    else if (a === '--clear-node-modules') opts.clearNodeModules = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--roots') {
      const next = args.shift() ?? '';
      if (!next) throw new Error('--roots requires a comma-separated path argument.');
      opts.roots = next.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (a === '--remove') {
      let next = args.shift();
      if (!next) throw new Error('--remove requires at least one path argument.');
      while (next && !next.startsWith('-')) {
        opts.remove.push(next);
        next = args.length > 0 && !args[0].startsWith('-') ? args.shift() : null;
      }
      if (next && next.startsWith('-')) args.unshift(next);
    } else if (a.startsWith('-')) {
      throw new Error(`Unknown option: ${a}`);
    } else {
      throw new Error(`Unexpected argument: ${a} (explicit paths must follow --remove)`);
    }
  }
  return opts;
}

/** Parse `git worktree list --porcelain` into [{ path, head, branch }]. */
function getGitWorktrees() {
  let out = '';
  try {
    out = execSync('git worktree list --porcelain', { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return [];
  }
  const entries = [];
  let current = null;
  for (const line of out.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (current) entries.push(current);
      current = { path: line.slice('worktree '.length).trim(), head: '', branch: '' };
    } else if (current && line.startsWith('HEAD ')) {
      current.head = line.slice('HEAD '.length).trim();
    } else if (current && line.startsWith('branch ')) {
      current.branch = line.slice('branch '.length).trim().replace(/^refs\/heads\//, '');
    } else if (line === '' && current) {
      entries.push(current);
      current = null;
    }
  }
  if (current) entries.push(current);
  return entries;
}

function listSubdirs(root) {
  try {
    return readdirSync(root)
      .map((name) => path.join(root, name))
      .filter((p) => {
        try {
          return statSync(p).isDirectory();
        } catch {
          return false;
        }
      });
  } catch {
    return [];
  }
}

/** Size in KiB via `du -sk` (null on failure). Slow on multi-GB checkouts but accurate. */
function dirSizeKb(dir) {
  try {
    const out = execSync(`du -sk ${JSON.stringify(dir)}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const kb = parseInt(out.split('\t')[0], 10);
    return Number.isFinite(kb) ? kb : null;
  } catch {
    return null;
  }
}

function formatSize(kb) {
  if (kb == null) return 'unknown';
  if (kb >= 1024 * 1024) return `${(kb / (1024 * 1024)).toFixed(1)}G`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)}M`;
  return `${kb}K`;
}

/** Guard: only allow destructive ops inside known roots or on git worktree paths (never main). */
function isDeletable(target, { gitPaths, scanRoots, mainPath }) {
  const abs = path.resolve(target);
  if (abs === path.resolve(mainPath) || abs === path.resolve(REPO_ROOT)) return false;
  if (gitPaths.has(abs)) return true;
  return scanRoots.some((root) => abs === path.resolve(root) || abs.startsWith(`${path.resolve(root)}/`));
}

function removePath(target, dryRun) {
  if (dryRun) {
    console.log(`  (dry-run) would remove: ${target}`);
    return true;
  }
  // Prefer `git worktree remove --force` when git still tracks the path.
  const tracked = gitOutput(`worktree list --porcelain`).includes(target);
  if (tracked) {
    const result = spawnSync('git', ['worktree', 'remove', '--force', target], { cwd: REPO_ROOT, stdio: 'inherit' });
    if ((result.status ?? 1) === 0) return true;
    console.warn(`  git worktree remove failed for ${target}, falling back to rm -rf`);
  }
  try {
    rmSync(target, { recursive: true, force: true });
    console.log(`  removed: ${target}`);
    return true;
  } catch (error) {
    console.error(`  FAILED to remove ${target}: ${error.message}`);
    return false;
  }
}

function main() {
  const rawArgs = process.argv.slice(2);
  if (hasHelpFlag(rawArgs)) {
    printHelp();
    return 0;
  }
  let opts;
  try {
    opts = parseArgs(rawArgs);
  } catch (error) {
    console.error(`ai-worktree-audit: ${error.message}\n`);
    printHelp();
    return 1;
  }

  if (opts.prune && !opts.json) {
    console.log('$ git worktree prune');
    if (!opts.dryRun) spawnSync('git', ['worktree', 'prune'], { cwd: REPO_ROOT, stdio: 'inherit' });
  }

  const scanRoots = (opts.roots ?? DEFAULT_ROOTS).map((r) => path.resolve(r)).filter((r) => {
    if (!existsSync(r)) {
      console.log(`(scan root missing, skipping: ${r})`);
      return false;
    }
    return true;
  });

  const gitWorktrees = getGitWorktrees();
  const mainEntry = gitWorktrees[0] ?? { path: REPO_ROOT, branch: 'main' };
  const gitPaths = new Set(gitWorktrees.map((w) => path.resolve(w.path)));
  const mergedBranches = new Set(
    gitOutput('branch --merged main')
      .split('\n')
      .map((l) => l.replace(/^\*?\s*\+?\s*/, '').trim())
      .filter(Boolean),
  );

  const diskDirs = new Map();
  for (const root of scanRoots) {
    for (const dir of listSubdirs(root)) diskDirs.set(path.resolve(dir), root);
  }

  const worktrees = gitWorktrees.map((w) => {
    const abs = path.resolve(w.path);
    const branch = w.branch === '(detached)' || !w.branch ? '(detached)' : w.branch;
    const dirtyRaw = gitOutput('status --porcelain', w.path);
    const dirty = dirtyRaw ? dirtyRaw.split('\n').filter(Boolean).length : 0;
    const sizeKb = dirSizeKb(w.path);
    const nmPath = path.join(w.path, 'node_modules');
    const nodeModulesKb = existsSync(nmPath) ? dirSizeKb(nmPath) : 0;
    return {
      path: w.path,
      source: 'git',
      branch,
      merged: branch !== '(detached)' && mergedBranches.has(branch),
      dirtyFiles: dirty,
      sizeKb,
      nodeModulesKb,
      isMain: abs === path.resolve(mainEntry.path),
    };
  });

  const orphans = [];
  for (const [dir] of diskDirs) {
    if (gitPaths.has(dir)) continue;
    const probe = gitOutput('rev-parse --abbrev-ref HEAD', dir);
    orphans.push({
      path: dir,
      source: 'disk',
      branch: probe || '(unknown)',
      broken: !probe,
      sizeKb: dirSizeKb(dir),
      nodeModulesKb: existsSync(path.join(dir, 'node_modules')) ? dirSizeKb(path.join(dir, 'node_modules')) : 0,
    });
  }

  const totalKb = [...worktrees, ...orphans].reduce((sum, w) => sum + (w.sizeKb ?? 0), 0);
  const orphanKb = orphans.reduce((sum, w) => sum + (w.sizeKb ?? 0), 0);
  const mergedCandidates = worktrees.filter((w) => !w.isMain && w.merged);

  const report = {
    repo: REPO_ROOT,
    scanRoots,
    main: mainEntry.path,
    worktrees,
    orphans,
    totals: {
      gitWorktrees: worktrees.length,
      orphans: orphans.length,
      totalKb,
      orphanKb,
      mergedCandidates: mergedCandidates.map((w) => w.path),
    },
  };

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
    return 0;
  }

  console.log(`\nai-worktree-audit: ${REPO_ROOT}`);
  console.log(`scan roots: ${scanRoots.join(', ') || '(none found)'}\n`);
  console.log('git worktrees:');
  for (const w of worktrees) {
    const flags = [w.isMain ? 'main checkout' : null, !w.isMain && w.merged ? 'merged' : null, !w.isMain && !w.merged ? 'not-merged' : null, w.dirtyFiles > 0 ? `${w.dirtyFiles} dirty` : 'clean']
      .filter(Boolean)
      .join(', ');
    console.log(`  ${formatSize(w.sizeKb).padStart(6)}  ${w.path}`);
    console.log(`           branch=${w.branch} (${flags}) node_modules=${formatSize(w.nodeModulesKb)}`);
  }
  console.log(`\norphaned disk dirs (${orphans.length}):`);
  if (orphans.length === 0) console.log('  (none)');
  for (const o of orphans) {
    console.log(`  ${formatSize(o.sizeKb).padStart(6)}  ${o.path}${o.broken ? '  [broken .git]' : ''}`);
  }
  console.log(
    `\ntotals: ${worktrees.length} git worktree(s) + ${orphans.length} orphan(s) = ${formatSize(totalKb)} (${formatSize(orphanKb)} orphaned)`,
  );
  if (mergedCandidates.length > 0) {
    console.log(`merged-into-main candidates (${mergedCandidates.length}):`);
    for (const w of mergedCandidates) console.log(`  - ${w.path} (${w.branch})`);
  }

  let failures = 0;
  const destructive = opts.deleteOrphans || opts.deleteMerged || opts.clearNodeModules || opts.remove.length > 0;
  if (!destructive) {
    console.log('\nreport only. Add --delete-orphans, --delete-merged, --clear-node-modules, or --remove <path...> to clean up.');
    return 0;
  }

  if (opts.deleteOrphans) {
    console.log(`\ndeleting ${orphans.length} orphan(s):`);
    if (orphans.length === 0) console.log('  (none)');
    for (const o of orphans) {
      if (!isDeletable(o.path, { gitPaths, scanRoots, mainPath: mainEntry.path })) {
        console.warn(`  (refuse, outside deletable scope: ${o.path})`);
        failures += 1;
        continue;
      }
      if (!removePath(o.path, opts.dryRun)) failures += 1;
    }
  }

  if (opts.deleteMerged) {
    console.log(`\ndeleting ${mergedCandidates.length} merged worktree(s):`);
    if (mergedCandidates.length === 0) console.log('  (none)');
    for (const w of mergedCandidates) {
      if (!isDeletable(w.path, { gitPaths, scanRoots, mainPath: mainEntry.path })) {
        console.warn(`  (refuse, outside deletable scope: ${w.path})`);
        failures += 1;
        continue;
      }
      if (w.dirtyFiles > 0) {
        console.warn(`  (skip, ${w.dirtyFiles} uncommitted file(s): ${w.path} — commit first or use --remove)`);
        continue;
      }
      if (!removePath(w.path, opts.dryRun)) failures += 1;
    }
  }

  if (opts.clearNodeModules) {
    const targets = worktrees.filter((w) => !w.isMain && (w.nodeModulesKb ?? 0) > 0);
    console.log(`\nclearing node_modules in ${targets.length} worktree(s) (main excluded):`);
    if (targets.length === 0) console.log('  (none)');
    for (const w of targets) {
      const nm = path.join(w.path, 'node_modules');
      if (opts.dryRun) {
        console.log(`  (dry-run) would remove: ${nm} (${formatSize(w.nodeModulesKb)})`);
        continue;
      }
      try {
        rmSync(nm, { recursive: true, force: true });
        console.log(`  cleared: ${nm} (was ${formatSize(w.nodeModulesKb)})`);
      } catch (error) {
        console.error(`  FAILED ${nm}: ${error.message}`);
        failures += 1;
      }
    }
  }

  if (opts.remove.length > 0) {
    console.log(`\nremoving ${opts.remove.length} explicit path(s):`);
    for (const target of opts.remove) {
      const abs = path.resolve(target);
      if (!isDeletable(abs, { gitPaths, scanRoots, mainPath: mainEntry.path })) {
        console.warn(`  (refuse, outside deletable scope or is main checkout: ${target})`);
        failures += 1;
        continue;
      }
      if (!existsSync(abs)) {
        console.warn(`  (skip, missing: ${target})`);
        continue;
      }
      if (!removePath(abs, opts.dryRun)) failures += 1;
    }
  }

  if (!opts.dryRun) spawnSync('git', ['worktree', 'prune'], { cwd: REPO_ROOT, stdio: 'ignore' });
  console.log(failures === 0 ? '\nai-worktree-audit: OK' : `\nai-worktree-audit: DONE with ${failures} failure(s)`);
  return failures === 0 ? 0 : 1;
}

process.exit(main());
