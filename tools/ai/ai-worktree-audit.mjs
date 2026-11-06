#!/usr/bin/env node
/**
 * AI worktree audit helper.
 *
 * Finds checkouts across the standard agent tool roots (T3 Code
 * `~/.t3/worktrees/<repo>`, Gemini Antigravity
 * `~/.gemini/antigravity/worktrees/<repo>`, and OpenCode
 * `~/.local/share/opencode/worktree/<hash>/<name>`), reports sizes, and
 * flags orphaned directories (on disk but unknown to `git worktree list`,
 * or with a broken `.git` pointer). Optional flags perform cleanup.
 *
 * By default only the current repo is audited. `--all-repos` expands to
 * every repo found under the tool worktree roots. An `extras` section
 * always reports sizes of other common agent paths (`~/.t3/scratch`,
 * `~/.t3/caches`) without touching them.
 *
 * Usage:
 *   yarn ai:worktree:audit                        # report current repo only
 *   yarn ai:worktree:audit --all-repos             # report every repo
 *   yarn ai:worktree:audit --prune                 # + `git worktree prune`
 *   yarn ai:worktree:audit --delete-orphans        # + rm -rf orphaned dirs
 *   yarn ai:worktree:audit --delete-merged         # + remove worktrees merged into main
 *   yarn ai:worktree:audit --clear-node-modules    # + rm -rf node_modules in worktrees (mains excluded)
 *   yarn ai:worktree:audit --remove <path...>      # + remove explicit path(s)
 *   yarn ai:worktree:audit --roots <a,b,...>       # override scan roots (per-repo dirs, or family roots with --all-repos)
 *   yarn ai:worktree:audit --json                  # machine-readable report, no actions
 *   yarn ai:worktree:audit --dry-run               # preview destructive actions
 *
 * Destructive flags compose (e.g. `--delete-orphans --clear-node-modules`).
 * `--dry-run` previews without executing. Main checkouts and the current
 * working checkout are never deleted or stripped. Extras are size-only and
 * are only ever removed via explicit `--remove`. Zero dependencies (node
 * builtins only).
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gitOutput, hasHelpFlag, REPO_ROOT } from './_shared.mjs';

const REPO_NAME = (() => {
  // basename(REPO_ROOT) is the worktree dir name when running inside a linked
  // worktree, so resolve the real repo name from the main checkout instead.
  try {
    const out = execSync('git worktree list --porcelain', {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const first = out.split('\n').find((l) => l.startsWith('worktree '));
    if (first) return path.basename(first.slice('worktree '.length).trim());
  } catch {
    // fall through to directory basename
  }
  return path.basename(REPO_ROOT);
})();
const HOME = os.homedir();
/** Family roots, each containing one directory per repo. */
const FAMILY_ROOTS = [path.join(HOME, '.t3', 'worktrees'), path.join(HOME, '.gemini', 'antigravity', 'worktrees')];
/** OpenCode worktrees live two levels deep: <hash>/<name>. */
const OPENCODE_ROOT = path.join(HOME, '.local', 'share', 'opencode', 'worktree');
/** Other common agent paths: reported size-only, never auto-deleted. */
const EXTRA_PATHS = [path.join(HOME, '.t3', 'scratch'), path.join(HOME, '.t3', 'caches')];

function printHelp() {
  console.log(`ai-worktree-audit: audit git worktrees across agent tool roots

Usage:
  yarn ai:worktree:audit [options]

Options:
  --all-repos           Audit every repo under the tool worktree roots (default: current repo only)
  --prune               Run \`git worktree prune\` in each audited repo before auditing
  --delete-orphans      Remove disk dirs unknown to \`git worktree list\`
  --delete-merged       Remove worktrees whose branch is merged into the default branch
  --clear-node-modules  Remove node_modules inside worktrees (main checkouts excluded)
  --remove <path...>    Remove explicit path(s) (worktrees, orphans, or extras)
  --roots <a,b,...>     Override scan roots (per-repo dirs, or family roots with --all-repos)
  --json                Print JSON report {repos, extras, totals} and skip actions
  --dry-run             Preview destructive actions without executing
  -h, --help            Show this help

Orphans = directory under a repo scan root that is not listed by
\`git worktree list\`, or whose gitlink is broken (not a git repository).
Merged = worktree branch appears in \`git branch --merged <default>\`.`);
}

function parseArgs(rawArgs) {
  const opts = {
    allRepos: false,
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
    if (a === '--all-repos') opts.allRepos = true;
    else if (a === '--prune') opts.prune = true;
    else if (a === '--delete-orphans') opts.deleteOrphans = true;
    else if (a === '--delete-merged') opts.deleteMerged = true;
    else if (a === '--clear-node-modules') opts.clearNodeModules = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--roots') {
      const next = args.shift() ?? '';
      if (!next) throw new Error('--roots requires a comma-separated path argument.');
      opts.roots = next
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
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

/** Run a git command in a specific directory, returning trimmed stdout (or '' on failure). */
function gitIn(dir, args) {
  try {
    return execSync(`git ${args}`, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

/** Parse `git worktree list --porcelain` in dir into [{ path, head, branch }]. */
function getGitWorktrees(dir) {
  const out = gitIn(dir, 'worktree list --porcelain');
  if (!out) return [];
  const entries = [];
  let current = null;
  for (const line of out.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (current) entries.push(current);
      current = { path: line.slice('worktree '.length).trim(), head: '', branch: '' };
    } else if (current && line.startsWith('HEAD ')) {
      current.head = line.slice('HEAD '.length).trim();
    } else if (current && line.startsWith('branch ')) {
      current.branch = line
        .slice('branch '.length)
        .trim()
        .replace(/^refs\/heads\//, '');
    } else if (line === '' && current) {
      entries.push(current);
      current = null;
    }
  }
  if (current) entries.push(current);
  return entries;
}

/** Best-effort default branch for merge detection (origin HEAD, else `main`). */
function defaultBranch(cwd) {
  const ref = gitIn(cwd, 'symbolic-ref refs/remotes/origin/HEAD');
  if (ref) return ref.split('/').pop();
  return 'main';
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

function nodeModulesKb(dir) {
  const nm = path.join(dir, 'node_modules');
  return existsSync(nm) ? dirSizeKb(nm) : 0;
}

function formatSize(kb) {
  if (kb == null) return 'unknown';
  if (kb >= 1024 * 1024) return `${(kb / (1024 * 1024)).toFixed(1)}G`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)}M`;
  return `${kb}K`;
}

/** Audit one repo from its known on-disk checkout dirs. */
function auditRepo(name, wtDirs) {
  const resolved = [...new Set(wtDirs.map((d) => path.resolve(d)))];
  const probeCwd = resolved.find((d) => gitIn(d, 'rev-parse --is-inside-work-tree') === 'true') ?? null;
  const gitWorktrees = probeCwd ? getGitWorktrees(probeCwd) : [];
  const mainEntry = gitWorktrees[0] ?? null;
  const gitPaths = new Set(gitWorktrees.map((w) => path.resolve(w.path)));
  const defBranch = probeCwd ? defaultBranch(probeCwd) : 'main';
  const mergedBranches = probeCwd
    ? new Set(
        gitIn(probeCwd, `branch --merged ${defBranch}`)
          .split('\n')
          .map((l) => l.replace(/^\*?\s*\+?\s*/, '').trim())
          .filter(Boolean),
      )
    : new Set();

  const worktrees = gitWorktrees.map((w) => {
    const branch = w.branch === '(detached)' || !w.branch ? '(detached)' : w.branch;
    const dirtyRaw = gitIn(w.path, 'status --porcelain');
    const dirty = dirtyRaw ? dirtyRaw.split('\n').filter(Boolean).length : 0;
    return {
      path: w.path,
      source: 'git',
      branch,
      merged: branch !== '(detached)' && mergedBranches.has(branch),
      dirtyFiles: dirty,
      sizeKb: dirSizeKb(w.path),
      nodeModulesKb: nodeModulesKb(w.path),
      isMain: mainEntry != null && path.resolve(w.path) === path.resolve(mainEntry.path),
    };
  });

  const diskDirs = new Map();
  for (const dir of resolved) diskDirs.set(dir, null);

  const orphans = [];
  for (const [dir] of diskDirs) {
    if (gitPaths.has(dir)) continue;
    const probe = gitIn(dir, 'rev-parse --abbrev-ref HEAD');
    orphans.push({
      path: dir,
      source: 'disk',
      branch: probe || '(unknown)',
      broken: !probe,
      sizeKb: dirSizeKb(dir),
      nodeModulesKb: nodeModulesKb(dir),
    });
  }

  return {
    name,
    dirs: resolved,
    main: mainEntry ? mainEntry.path : null,
    gitAvailable: probeCwd != null,
    defaultBranch: defBranch,
    worktrees,
    orphans,
  };
}

/**
 * Guard: only allow destructive ops on audited git worktree paths, inside
 * audited scan dirs, or on extras (explicit --remove only). Never main
 * checkouts, and never the checkout this script runs from.
 */
function isDeletable(target, scope) {
  const abs = path.resolve(target);
  if (abs === path.resolve(REPO_ROOT)) return false;
  if (scope.mainPaths.has(abs)) return false;
  if (scope.gitPaths.has(abs)) return true;
  if (scope.extraPaths.has(abs)) return true;
  return scope.scanDirs.some((root) => abs.startsWith(`${path.resolve(root)}/`));
}

/** Remove a path, preferring `git worktree remove` when git tracks it. `repoCwd` must be inside the owning repo. */
function removePath(target, { dryRun, repoCwd }) {
  if (dryRun) {
    console.log(`  (dry-run) would remove: ${target}`);
    return true;
  }
  const tracked = repoCwd ? gitIn(repoCwd, 'worktree list --porcelain').includes(target) : false;
  if (tracked) {
    const result = spawnSync('git', ['worktree', 'remove', '--force', target], { cwd: repoCwd, stdio: 'inherit' });
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

function printRepo(repo) {
  console.log(`\n## ${repo.name}${repo.gitAvailable ? '' : '  [git unavailable — disk only]'}`);
  if (repo.main) console.log(`   main: ${repo.main} (default: ${repo.defaultBranch})`);
  console.log(`   git worktrees (${repo.worktrees.length}):`);
  if (repo.worktrees.length === 0) console.log('     (none)');
  for (const w of repo.worktrees) {
    const flags = [
      w.isMain ? 'main checkout' : null,
      !w.isMain && w.merged ? 'merged' : null,
      !w.isMain && !w.merged ? 'not-merged' : null,
      w.dirtyFiles > 0 ? `${w.dirtyFiles} dirty` : 'clean',
    ]
      .filter(Boolean)
      .join(', ');
    console.log(`     ${formatSize(w.sizeKb).padStart(6)}  ${w.path}`);
    console.log(`               branch=${w.branch} (${flags}) node_modules=${formatSize(w.nodeModulesKb)}`);
  }
  if (repo.orphans.length > 0) {
    console.log(`   orphaned disk dirs (${repo.orphans.length}):`);
    for (const o of repo.orphans) {
      console.log(`     ${formatSize(o.sizeKb).padStart(6)}  ${o.path}${o.broken ? '  [broken .git]' : ''}`);
    }
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

  // Resolve which repos to audit: { name -> checkout dirs[] }. Repo identity
  // is the main checkout path (first entry of `git worktree list`), because
  // `--show-toplevel` inside a linked worktree returns the worktree itself.
  // Checkouts of the same repo across tool families merge into one entry.
  const byRepo = new Map();
  const addCandidate = (dir, fallbackName) => {
    const abs = path.resolve(dir);
    const out = gitIn(abs, 'worktree list --porcelain');
    const first = out.split('\n').find((l) => l.startsWith('worktree '));
    const name = first ? path.basename(first.slice('worktree '.length).trim()) : (fallbackName ?? '(unresolved)');
    if (!byRepo.has(name)) byRepo.set(name, new Set());
    byRepo.get(name).add(abs);
  };
  if (opts.allRepos) {
    const families = opts.roots ?? FAMILY_ROOTS;
    for (const family of families) {
      for (const repoDir of listSubdirs(family)) {
        for (const wt of listSubdirs(repoDir)) addCandidate(wt, path.basename(repoDir));
      }
    }
    if (!opts.roots && existsSync(OPENCODE_ROOT)) {
      for (const hash of listSubdirs(OPENCODE_ROOT)) {
        for (const wt of listSubdirs(hash)) addCandidate(wt, null);
      }
    }
    if (byRepo.size === 0) console.log('(no repos found under family roots)');
  } else {
    const perRepoRoots = opts.roots ?? FAMILY_ROOTS.map((f) => path.join(f, REPO_NAME));
    const set = new Set([REPO_ROOT]);
    for (const r of perRepoRoots.map((x) => path.resolve(x))) {
      if (!existsSync(r)) {
        console.log(`(scan root missing, skipping: ${r})`);
        continue;
      }
      for (const wt of listSubdirs(r)) set.add(path.resolve(wt));
    }
    byRepo.set(REPO_NAME, set);
  }

  const repos = [...byRepo.entries()].map(([name, set]) => auditRepo(name, [...set]));

  if (opts.prune && !opts.json) {
    for (const repo of repos) {
      const cwd = repo.worktrees[0]?.path ?? repo.dirs[0];
      if (!repo.gitAvailable || !cwd) continue;
      console.log(`$ git worktree prune (${repo.name})`);
      if (!opts.dryRun) spawnSync('git', ['worktree', 'prune'], { cwd, stdio: 'inherit' });
    }
  }

  const extras = EXTRA_PATHS.filter((p) => existsSync(p)).map((p) => ({ path: p, sizeKb: dirSizeKb(p) }));

  const allWorktrees = repos.flatMap((r) => r.worktrees.map((w) => ({ ...w, repo: r.name, repoCwd: r.dirs[0] })));
  const allOrphans = repos.flatMap((r) => r.orphans.map((o) => ({ ...o, repo: r.name, repoCwd: r.dirs[0] })));
  const mergedCandidates = allWorktrees.filter((w) => !w.isMain && w.merged);
  const sum = (items) => items.reduce((total, w) => total + (w.sizeKb ?? 0), 0);
  const totals = {
    repos: repos.length,
    gitWorktrees: allWorktrees.length,
    orphans: allOrphans.length,
    totalKb: sum(allWorktrees) + sum(allOrphans),
    orphanKb: sum(allOrphans),
    extrasKb: sum(extras),
    mergedCandidates: mergedCandidates.map((w) => w.path),
  };

  const report = {
    mode: opts.allRepos ? 'all-repos' : 'current-repo',
    repos,
    extras,
    totals,
  };

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
    return 0;
  }

  console.log(`\nai-worktree-audit: ${opts.allRepos ? 'all repos' : REPO_ROOT}`);
  for (const repo of repos) printRepo(repo);

  if (extras.length > 0) {
    console.log(`\nextras (size-only, use --remove to delete):`);
    for (const e of extras) console.log(`  ${formatSize(e.sizeKb).padStart(6)}  ${e.path}`);
  }
  console.log(
    `\ntotals: ${totals.repos} repo(s), ${totals.gitWorktrees} worktree(s) + ${totals.orphans} orphan(s) = ${formatSize(totals.totalKb)} (${formatSize(totals.orphanKb)} orphaned, ${formatSize(totals.extrasKb)} extras)`,
  );
  if (mergedCandidates.length > 0) {
    console.log(`merged candidates (${mergedCandidates.length}):`);
    for (const w of mergedCandidates) console.log(`  - ${w.path} (${w.repo}/${w.branch})`);
  }

  let failures = 0;
  const destructive = opts.deleteOrphans || opts.deleteMerged || opts.clearNodeModules || opts.remove.length > 0;
  if (!destructive) {
    console.log(
      '\nreport only. Add --delete-orphans, --delete-merged, --clear-node-modules, or --remove <path...> to clean up.',
    );
    return 0;
  }

  const scope = {
    gitPaths: new Set(allWorktrees.map((w) => path.resolve(w.path))),
    mainPaths: new Set(repos.flatMap((r) => (r.main ? [path.resolve(r.main)] : []))),
    scanDirs: [...repos.flatMap((r) => r.dirs), ...(opts.roots ?? []).map((r) => path.resolve(r))],
    extraPaths: new Set(extras.map((e) => path.resolve(e.path))),
  };

  if (opts.deleteOrphans) {
    console.log(`\ndeleting ${allOrphans.length} orphan(s):`);
    if (allOrphans.length === 0) console.log('  (none)');
    for (const o of allOrphans) {
      if (!isDeletable(o.path, scope)) {
        console.warn(`  (refuse, outside deletable scope: ${o.path})`);
        failures += 1;
        continue;
      }
      if (!removePath(o.path, { dryRun: opts.dryRun, repoCwd: o.repoCwd })) failures += 1;
    }
  }

  if (opts.deleteMerged) {
    console.log(`\ndeleting ${mergedCandidates.length} merged worktree(s):`);
    if (mergedCandidates.length === 0) console.log('  (none)');
    for (const w of mergedCandidates) {
      if (!isDeletable(w.path, scope)) {
        console.warn(`  (refuse, outside deletable scope: ${w.path})`);
        failures += 1;
        continue;
      }
      if (w.dirtyFiles > 0) {
        console.warn(`  (skip, ${w.dirtyFiles} uncommitted file(s): ${w.path} — commit first or use --remove)`);
        continue;
      }
      if (!removePath(w.path, { dryRun: opts.dryRun, repoCwd: w.repoCwd })) failures += 1;
    }
  }

  if (opts.clearNodeModules) {
    const targets = allWorktrees.filter((w) => !w.isMain && (w.nodeModulesKb ?? 0) > 0);
    console.log(`\nclearing node_modules in ${targets.length} worktree(s) (mains excluded):`);
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
      if (!isDeletable(abs, scope)) {
        console.warn(`  (refuse, outside deletable scope or is a main checkout: ${target})`);
        failures += 1;
        continue;
      }
      if (!existsSync(abs)) {
        console.warn(`  (skip, missing: ${target})`);
        continue;
      }
      const owner =
        allWorktrees.find((w) => path.resolve(w.path) === abs) ?? allOrphans.find((o) => path.resolve(o.path) === abs);
      if (!removePath(abs, { dryRun: opts.dryRun, repoCwd: owner?.repoCwd ?? path.dirname(abs) })) failures += 1;
    }
  }

  if (!opts.dryRun) {
    for (const repo of repos) {
      const cwd = repo.worktrees[0]?.path ?? repo.dirs[0];
      if (repo.gitAvailable && cwd) spawnSync('git', ['worktree', 'prune'], { cwd, stdio: 'ignore' });
    }
  }
  console.log(failures === 0 ? '\nai-worktree-audit: OK' : `\nai-worktree-audit: DONE with ${failures} failure(s)`);
  return failures === 0 ? 0 : 1;
}

process.exit(main());
