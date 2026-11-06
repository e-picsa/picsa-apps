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
 * every repo found under the tool worktree roots. Only git worktree paths
 * are ever touched; anything else on disk is out of scope.
 *
 * Usage:
 *   yarn ai:worktree:audit                        # report current repo only
 *   yarn ai:worktree:audit --all-repos             # report every repo
 *   yarn ai:worktree:audit --node-modules-only     # fast mode: node_modules reclaim only, skips full-tree sizing
 *   yarn ai:worktree:audit --prune                 # + `git worktree prune`
 *   yarn ai:worktree:audit --delete-orphans        # + rm -rf orphaned dirs
 *   yarn ai:worktree:audit --delete-merged         # + remove worktrees merged into main
 *   yarn ai:worktree:audit --clear-node-modules    # + rm -rf node_modules in worktrees (mains excluded)
 *   yarn ai:worktree:audit --remove <path...>      # + remove explicit path(s)
 *   yarn ai:worktree:audit --roots <a,b,...>       # override scan roots (per-repo dirs, or family roots with --all-repos)
 *   yarn ai:worktree:audit --json                  # machine-readable report, no actions
 *   yarn ai:worktree:audit --dry-run               # preview destructive actions
 *   yarn ai:worktree:audit --delete-merged --yes    # confirm non-interactively
 *
 * Destructive flags compose (e.g. `--delete-orphans --clear-node-modules`).
 * Every destructive run first prints each exact command (`git worktree
 * remove`, `rm -rf`, `git worktree prune`) and requires typed `yes`
 * confirmation — unless `--dry-run` (preview only) or `--yes` is passed.
 * Without a terminal and without `--yes`, destructive actions are refused.
 * Main checkouts and the current working checkout are never deleted or
 * stripped. The main checkout is shown separately as reference-only.
 * Extras are size-only and are never suggested for deletion. A markdown
 * companion report is written next to this script on every run
 * (git-ignored). Zero dependencies (node builtins only).
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { hasHelpFlag, REPO_ROOT } from './_shared.mjs';

/** Companion markdown report, written next to this script on every run (git-ignored). */
const SIDECAR_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ai-worktree-audit-report.md');

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

function printHelp() {
  console.log(`ai-worktree-audit: audit git worktrees across agent tool roots

Usage:
  yarn ai:worktree:audit [options]

Options:
  --all-repos           Audit every repo under the tool worktree roots (default: current repo only)
  --node-modules-only   Fast mode: skip full-tree sizing, report node_modules reclaim only
  --prune               Run \`git worktree prune\` in each audited repo before auditing
  --delete-orphans      Remove disk dirs unknown to \`git worktree list\`
  --delete-merged       Remove worktrees whose branch is merged into the default branch
  --clear-node-modules  Remove node_modules inside worktrees (main checkouts excluded)
  --remove <path|name>   Remove an audited worktree or orphan by path, directory name, or branch (refused if it has uncommitted changes)
  --roots <a,b,...>     Override scan roots (per-repo dirs, or family roots with --all-repos)
  --json                Print JSON report {repos, totals} and skip actions
  --markdown            Print Markdown report and skip actions
  --dry-run             Preview destructive actions without executing
  --yes                 Confirm destructive actions non-interactively (otherwise prompts)
  -h, --help            Show this help

Destructive actions always print every exact command first and require
typed confirmation, unless --dry-run (preview only) or --yes is passed.
Without a terminal and without --yes, destructive actions are refused.

Orphans = directory under a repo scan root that is not listed by
\`git worktree list\`, or whose gitlink is broken (not a git repository).
Merged = worktree branch appears in \`git branch --merged <default>\`.`);
}

function parseArgs(rawArgs) {
  const opts = {
    allRepos: false,
    prune: false,
    nodeModulesOnly: false,
    deleteOrphans: false,
    deleteMerged: false,
    clearNodeModules: false,
    json: false,
    markdown: false,
    dryRun: false,
    yes: false,
    roots: null,
    remove: [],
  };
  const args = [...rawArgs];
  while (args.length > 0) {
    const a = args.shift();
    if (a === '--all-repos') opts.allRepos = true;
    else if (a === '--node-modules-only') opts.nodeModulesOnly = true;
    else if (a === '--prune') opts.prune = true;
    else if (a === '--delete-orphans') opts.deleteOrphans = true;
    else if (a === '--delete-merged') opts.deleteMerged = true;
    else if (a === '--clear-node-modules') opts.clearNodeModules = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--markdown') opts.markdown = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--yes') opts.yes = true;
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
        next = args.length > 0 && !args[0]?.startsWith('-') ? args.shift() : null;
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
    const kb = Number.parseInt(out.split('\t')[0], 10);
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

/**
 * Days since the last file change in a checkout, without walking the tree:
 * the newest of (a) latest commit time, (b) mtimes of files listed by
 * `git status --porcelain`, (c) directory birthtime as a last resort.
 * Null when nothing is determinable.
 */
function activityAgeDays(cwd, statusRaw) {
  let latest = 0;
  const commitTs = Number.parseInt(gitIn(cwd, 'log -1 --format=%ct') || '0', 10);
  if (Number.isFinite(commitTs) && commitTs > 0) latest = Math.max(latest, commitTs * 1000);
  for (const line of (statusRaw || '').split('\n')) {
    if (!line.trim()) continue;
    let p = line.slice(3);
    const arrow = p.indexOf(' -> ');
    if (arrow >= 0) p = p.slice(arrow + 4);
    p = p.trim();
    if (p.length >= 2 && p.startsWith('"') && p.endsWith('"')) p = p.slice(1, -1);
    try {
      const mtime = statSync(path.join(cwd, p)).mtimeMs;
      if (Number.isFinite(mtime) && mtime > latest) latest = mtime;
    } catch {
      // entry vanished or unstatable — ignore
    }
  }
  if (!latest) {
    try {
      const birth = statSync(cwd).birthtimeMs;
      if (Number.isFinite(birth) && birth > 0) latest = birth;
    } catch {
      // ignore
    }
  }
  if (!latest) return null;
  return Math.max(0, Math.floor((Date.now() - latest) / 86400000));
}

/**
 * Progress output. Always goes to stderr so `--json` stdout stays parseable
 * while the user still sees activity during slow scans (`du` over GB trees).
 */
function progress(msg) {
  process.stderr.write(`${msg}\n`);
}

/** Audit one repo from its known on-disk checkout dirs. */
function auditRepo(name, wtDirs, { skipFullSize = false } = {}) {
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
    progress(`sizing ${w.path} ...`);
    const dirtyRaw = gitIn(w.path, 'status --porcelain');
    const dirty = dirtyRaw ? dirtyRaw.split('\n').filter(Boolean).length : 0;
    return {
      path: w.path,
      source: 'git',
      branch,
      merged: branch !== '(detached)' && mergedBranches.has(branch),
      dirtyFiles: dirty,
      sizeKb: skipFullSize ? null : dirSizeKb(w.path),
      nodeModulesKb: nodeModulesKb(w.path),
      isMain: mainEntry != null && path.resolve(w.path) === path.resolve(mainEntry.path),
      ageDays: activityAgeDays(w.path, dirtyRaw),
    };
  });

  const diskDirs = new Map();
  for (const dir of resolved) diskDirs.set(dir, null);

  const orphans = [];
  for (const [dir] of diskDirs) {
    if (gitPaths.has(dir)) continue;
    progress(`sizing ${dir} ...`);
    const probe = gitIn(dir, 'rev-parse --abbrev-ref HEAD');
    const statusRaw = probe ? gitIn(dir, 'status --porcelain') : '';
    orphans.push({
      path: dir,
      source: 'disk',
      branch: probe || '(unknown)',
      broken: !probe,
      dirtyFiles: statusRaw ? statusRaw.split('\n').filter(Boolean).length : 0,
      sizeKb: skipFullSize ? null : dirSizeKb(dir),
      nodeModulesKb: nodeModulesKb(dir),
      ageDays: activityAgeDays(dir, statusRaw),
    });
  }

  return {
    name,
    dirs: resolved,
    main: mainEntry ? mainEntry.path : null,
    gitAvailable: probeCwd != null,
    probeCwd,
    defaultBranch: defBranch,
    worktrees,
    orphans,
  };
}

/**
 * Guard: only allow destructive ops on exact audited paths — a known git
 * worktree or a known orphan. Never main checkouts, and never the checkout
 * this script runs from. Anything else is refused.
 */
function isDeletable(target, scope) {
  const abs = path.resolve(target);
  if (abs === path.resolve(REPO_ROOT)) return false;
  if (scope.mainPaths.has(abs)) return false;
  if (scope.gitPaths.has(abs)) return true;
  if (scope.orphanPaths.has(abs)) return true;
  return false;
}

/** Prompt for typed confirmation on an interactive terminal. EOF aborts. */
function confirmActions(count) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      rl.close();
      resolve(value);
    };
    rl.question(`\nProceed with ${count} action(s)? Type 'yes' to continue: `, (answer) => {
      done(/^(y|yes)$/i.test(answer.trim()));
    });
    rl.on('close', () => done(false));
  });
}

/**
 * Run a planned removal, preferring `git worktree remove` when git tracks the
 * path. The exact command was already shown in the preview; it is echoed
 * again here so the terminal log shows what ran.
 */
function runRemove(item) {
  console.log(`$ ${item.command}`);
  if (item.command.startsWith('git -C')) {
    const result = spawnSync('git', ['worktree', 'remove', '--force', item.path], {
      cwd: item.repoCwd,
      stdio: 'inherit',
    });
    if ((result.status ?? 1) === 0) return true;
    console.warn(`  git worktree remove failed for ${item.path}, falling back to rm -rf`);
  }
  try {
    rmSync(item.path, { recursive: true, force: true });
    console.log(`  removed: ${item.path}`);
    return true;
  } catch (error) {
    console.error(`  FAILED to remove ${item.path}: ${error.message}`);
    return false;
  }
}

const SRC_NAMES = { M: 'main checkout', T: 'T3 worktree', G: 'Gemini worktree', O: 'OpenCode worktree' };
/** Legend limited to the sources actually present in a table. */
function legendFor(rows) {
  const present = [...new Set(rows.map((r) => r.SRC))].sort((a, b) => a.localeCompare(b));
  return `SRC: ${present.map((k) => `${k}=${SRC_NAMES[k] ?? '?'}`).join(', ')}`;
}

/** Single-letter source key so tables can use short names without full paths. */
function srcKey(p, isMain) {
  if (isMain) return 'M';
  if (p.includes('/.t3/worktrees/')) return 'T';
  if (p.includes('/.gemini/antigravity/worktrees/')) return 'G';
  if (p.includes('/opencode/worktree/')) return 'O';
  return '?';
}

/** Row builders shared by the console and markdown renderers. */
function worktreeRow(w) {
  return {
    SIZE: formatSize(w.sizeKb),
    WORKTREE: path.basename(w.path),
    SRC: srcKey(w.path, w.isMain),
    BRANCH: w.branch,
    'DIRTY FILES': w.dirtyFiles,
    'AGE (D)': w.ageDays ?? '?',
  };
}

function orphanRow(o) {
  return {
    SIZE: formatSize(o.sizeKb),
    DIR: path.basename(o.path),
    SRC: srcKey(o.path, false),
    BRANCH: o.branch,
    STATE: o.broken ? 'broken .git' : 'not in git',
    'DIRTY FILES': o.dirtyFiles,
    'AGE (D)': o.ageDays ?? '?',
  };
}

/** Minimal markdown table renderer (no dependencies). */
function mdTable(rows) {
  if (rows.length === 0) return '(none)\n';
  const headers = Object.keys(rows[0]);
  const esc = (v) => String(v).replace(/\|/g, '\\|');
  const lines = [`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`];
  for (const r of rows) lines.push(`| ${headers.map((h) => esc(r[h])).join(' | ')} |`);
  return `${lines.join('\n')}\n`;
}

function printRepo(repo) {
  console.log(`\n## ${repo.name}${repo.gitAvailable ? '' : '  [git unavailable — disk only]'}`);
  const main = repo.worktrees.find((w) => w.isMain) ?? null;
  const rest = repo.worktrees.filter((w) => !w.isMain);
  // The main checkout is reference-only: never deleted or stripped.
  if (main) {
    console.log(`   main (reference only, never modified): ${main.path}`);
    console.log(
      `     branch: ${main.branch} | size: ${formatSize(main.sizeKb)} | dirty files: ${main.dirtyFiles} | node_modules: ${formatSize(main.nodeModulesKb)}`,
    );
  } else if (repo.main) {
    console.log(`   main: ${repo.main} (default: ${repo.defaultBranch})`);
  }
  // Base paths once; tables below use short directory names.
  const bases = [...new Set([...rest, ...repo.orphans].map((w) => path.dirname(w.path)))].sort((a, b) =>
    a.localeCompare(b),
  );
  if (bases.length > 0) {
    console.log('   roots:');
    for (const b of bases) console.log(`     - ${b}`);
  }
  // Clean and dirty worktrees get separate tables: only clean ones are
  // ever candidates for removal, dirty ones are for human review.
  const bySizeDesc = (a, b) => (b.sizeKb ?? -1) - (a.sizeKb ?? -1);
  const clean = rest.filter((w) => !(w.dirtyFiles > 0)).sort(bySizeDesc);
  const dirty = rest.filter((w) => w.dirtyFiles > 0).sort(bySizeDesc);
  const withoutDirty = (row) => {
    const copy = { ...row };
    delete copy['DIRTY FILES'];
    return copy;
  };
  console.log(`   worktrees — clean (${clean.length}, sorted by size):`);
  if (clean.length === 0) {
    console.log('     (none)');
  } else {
    const rows = clean.map((w) => withoutDirty(worktreeRow(w)));
    console.log(`   ${legendFor(rows)}`);
    console.table(rows);
  }
  if (dirty.length > 0) {
    console.log(`   worktrees — uncommitted changes (${dirty.length}, open in VS Code, never auto-deleted):`);
    const rows = dirty.map(worktreeRow);
    console.log(`   ${legendFor(rows)}`);
    console.table(rows);
  }
  if (repo.orphans.length > 0) {
    console.log(`   orphans (${repo.orphans.length}, sorted by size):`);
    const rows = [...repo.orphans].sort(bySizeDesc).map(orphanRow);
    console.log(`   ${legendFor(rows)}`);
    console.table(rows);
  }
}

function printRepoMarkdown(repo) {
  const bySizeDesc = (a, b) => (b.sizeKb ?? -1) - (a.sizeKb ?? -1);
  const main = repo.worktrees.find((w) => w.isMain) ?? null;
  const rest = repo.worktrees.filter((w) => !w.isMain);
  const parts = [`## ${repo.name}${repo.gitAvailable ? '' : ' (git unavailable — disk only)'}`];
  if (main) {
    parts.push(
      `main (reference only, never modified): \`${main.path}\` (branch: ${main.branch}, size: ${formatSize(main.sizeKb)}, dirty files: ${main.dirtyFiles})`,
    );
  } else if (repo.main) {
    parts.push(`main: \`${repo.main}\` (default: ${repo.defaultBranch})`);
  }
  const bases = [...new Set([...rest, ...repo.orphans].map((w) => path.dirname(w.path)))].sort((a, b) =>
    a.localeCompare(b),
  );
  if (bases.length > 0) parts.push(`roots:\n${bases.map((b) => `- \`${b}\``).join('\n')}`);
  const cleanMd = rest.filter((w) => !(w.dirtyFiles > 0)).sort(bySizeDesc);
  const dirtyMd = rest.filter((w) => w.dirtyFiles > 0).sort(bySizeDesc);
  const withoutDirtyMd = (row) => {
    const copy = { ...row };
    delete copy['DIRTY FILES'];
    return copy;
  };
  const rows = cleanMd.map((w) => withoutDirtyMd(worktreeRow(w)));
  parts.push(`_${legendFor(rows)}_`);
  parts.push(`### Worktrees — clean (${cleanMd.length}, sorted by size)`);
  parts.push(mdTable(rows));
  if (dirtyMd.length > 0) {
    const dirtyRowsMd = dirtyMd.map(worktreeRow);
    parts.push(`_${legendFor(dirtyRowsMd)}_`);
    parts.push(`### Worktrees — uncommitted changes (${dirtyMd.length}, open in VS Code, never auto-deleted)`);
    parts.push(mdTable(dirtyRowsMd));
  }
  if (repo.orphans.length > 0) {
    const orphanRows = [...repo.orphans].sort(bySizeDesc).map(orphanRow);
    parts.push(`_${legendFor(orphanRows)}_`);
    parts.push(`### Orphans (${repo.orphans.length}, sorted by size)`);
    parts.push(mdTable(orphanRows));
  }
  return parts.join('\n\n');
}

/**
 * Focused node_modules reclaim view (used by --node-modules-only): no
 * full-tree sizes, just what can be freed. Safe even for in-use worktrees —
 * node_modules is regenerable via ai-worktree-setup.
 */
function reclaimRows(repo) {
  // Exactly what --clear-node-modules would act on: mains and the current
  // checkout are excluded, so every row here is actionable.
  const current = path.resolve(REPO_ROOT);
  return repo.worktrees
    .filter((w) => !w.isMain && path.resolve(w.path) !== current && (w.nodeModulesKb ?? 0) > 0)
    .sort((a, b) => (b.nodeModulesKb ?? 0) - (a.nodeModulesKb ?? 0))
    .map((w) => ({
      WORKTREE: path.basename(w.path),
      SRC: srcKey(w.path, false),
      NODE_MODULES: formatSize(w.nodeModulesKb),
      'DIRTY FILES': w.dirtyFiles,
      'AGE (D)': w.ageDays ?? '?',
    }));
}

function printReclaim(repo) {
  const rows = reclaimRows(repo);
  console.log(`\n## ${repo.name} — node_modules reclaim (safe even when in use; reinstall via ai-worktree-setup)`);
  if (rows.length === 0) {
    console.log('  (none)');
  } else {
    console.log(`  ${legendFor(rows)}`);
    console.table(rows);
  }
}

function printReclaimMarkdown(repo) {
  const rows = reclaimRows(repo);
  return [
    `## ${repo.name} — node_modules reclaim`,
    rows.length > 0 ? `_${legendFor(rows)}_ ${rows.length}` : '(none)',
    mdTable(rows),
  ].join('\n\n');
}

async function main() {
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

  // Resolve which repos to audit, keyed by canonical main checkout path so
  // distinct repos that share a directory basename stay separate. Identity
  // is the main checkout path (first entry of `git worktree list`), because
  // `--show-toplevel` inside a linked worktree returns the worktree itself.
  // Checkouts of the same repo across tool families merge into one entry.
  const byRepo = new Map();
  const addCandidate = (dir) => {
    const abs = path.resolve(dir);
    const out = gitIn(abs, 'worktree list --porcelain');
    const first = out.split('\n').find((l) => l.startsWith('worktree '));
    // Unresolvable dirs share one `(unresolved)` group; everything else keys
    // on the canonical main checkout path so same-named repos stay separate.
    const key = first ? first.slice('worktree '.length).trim() : 'unresolved';
    const name = first ? path.basename(key) : '(unresolved)';
    if (!byRepo.has(key)) byRepo.set(key, { name, dirs: new Set() });
    byRepo.get(key).dirs.add(abs);
  };
  if (opts.allRepos) {
    progress('searching for worktrees across tool roots ...');
    const families = opts.roots ?? FAMILY_ROOTS;
    for (const family of families) {
      for (const repoDir of listSubdirs(family)) {
        for (const wt of listSubdirs(repoDir)) addCandidate(wt);
      }
    }
    if (!opts.roots && existsSync(OPENCODE_ROOT)) {
      for (const hash of listSubdirs(OPENCODE_ROOT)) {
        for (const wt of listSubdirs(hash)) addCandidate(wt);
      }
    }
    if (byRepo.size === 0) progress('no repos found under family roots');
  } else {
    // Single-repo mode: candidates are discovered by directory name, then
    // re-keyed by canonical main checkout path inside auditRepo grouping.
    progress('searching for worktrees ...');
    const perRepoRoots = opts.roots ?? FAMILY_ROOTS.map((f) => path.join(f, REPO_NAME));
    const set = new Set([REPO_ROOT]);
    for (const r of perRepoRoots.map((x) => path.resolve(x))) {
      if (!existsSync(r)) {
        progress(`scan root missing, skipping: ${r}`);
        continue;
      }
      for (const wt of listSubdirs(r)) set.add(path.resolve(wt));
    }
    for (const wt of set) addCandidate(wt);
  }

  const repos = [...byRepo.values()].map(({ name, dirs }) => {
    progress(`auditing ${name} (${dirs.size} checkout(s)) ...`);
    return auditRepo(name, [...dirs], { skipFullSize: opts.nodeModulesOnly });
  });

  if (opts.prune && !opts.json) {
    for (const repo of repos) {
      const cwd = repo.probeCwd ?? repo.dirs[0];
      if (!repo.gitAvailable || !cwd) continue;
      console.log(`$ git worktree prune (${repo.name})`);
      if (!opts.dryRun) spawnSync('git', ['worktree', 'prune'], { cwd, stdio: 'inherit' });
    }
  }

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
    mergedCandidates: mergedCandidates.map((w) => w.path),
  };

  const report = {
    mode: opts.allRepos ? 'all-repos' : 'current-repo',
    repos,
    totals,
  };

  const scope = {
    gitPaths: new Set(allWorktrees.map((w) => path.resolve(w.path))),
    orphanPaths: new Set(allOrphans.map((o) => path.resolve(o.path))),
    mainPaths: new Set(repos.flatMap((r) => (r.main ? [path.resolve(r.main)] : []))),
  };
  const currentCheckout = path.resolve(REPO_ROOT);

  // Suggestion inputs, computed once and reused by the plan phase below.
  const deletableMerged = mergedCandidates.filter((w) => isDeletable(w.path, scope) && w.dirtyFiles === 0);
  const skippedDirtyMerged = mergedCandidates.filter((w) => isDeletable(w.path, scope) && w.dirtyFiles > 0);
  // Checkouts with uncommitted work are never deleted by any flag.
  // They are listed for human review instead.
  const dirtyCheckouts = [...allWorktrees, ...allOrphans].filter((w) => !w.isMain && (w.dirtyFiles ?? 0) > 0);
  const clearableTargets = allWorktrees.filter(
    (w) =>
      !w.isMain && path.resolve(w.path) !== currentCheckout && (w.nodeModulesKb ?? 0) > 0 && isDeletable(w.path, scope),
  );
  const clearableKb = clearableTargets.reduce((t, w) => t + (w.nodeModulesKb ?? 0), 0);
  const suggestions = [];
  if (deletableMerged.length > 0) {
    suggestions.push({
      flag: '--delete-merged',
      text: `remove ${deletableMerged.length} merged worktree(s)${skippedDirtyMerged.length > 0 ? ` (${skippedDirtyMerged.length} skipped: uncommitted changes)` : ''}`,
    });
  }
  if (clearableTargets.length > 0) {
    suggestions.push({
      flag: '--clear-node-modules',
      text: `free ${formatSize(clearableKb)} from node_modules in ${clearableTargets.length} worktree(s)`,
    });
  }
  if (!opts.allRepos) suggestions.push({ flag: '--all-repos', text: 'audit every repo' });
  suggestions.push({
    flag: '--remove <path|name>',
    text: 'remove a specific worktree (refused for main checkouts and checkouts with uncommitted changes)',
  });

  // Markdown companion report, always written next to the script (git-ignored).
  const markdownReport = (() => {
    const sections = [
      `# Worktree audit: ${opts.allRepos ? 'all repos' : REPO_ROOT}${opts.nodeModulesOnly ? ' (node_modules reclaim only)' : ''}`,
    ];
    for (const repo of repos)
      sections.push(opts.nodeModulesOnly ? printReclaimMarkdown(repo) : printRepoMarkdown(repo));
    if (dirtyCheckouts.length > 0) {
      sections.push(
        `## Needs review (${dirtyCheckouts.length} with uncommitted changes — never auto-deleted)\n\`\`\`sh\n${dirtyCheckouts.map((w) => `code ${w.path}`).join('\n')}\n\`\`\``,
      );
    }
    sections.push(
      opts.nodeModulesOnly
        ? `**Totals:** ${formatSize(clearableKb)} reclaimable node_modules in ${clearableTargets.length} worktree(s) (mains excluded)`
        : `**Totals:** ${totals.repos} repo(s), ${totals.gitWorktrees} worktree(s) + ${totals.orphans} orphan(s) = ${formatSize(totals.totalKb)} (${formatSize(totals.orphanKb)} orphaned)`,
    );
    if (suggestions.length > 0) {
      sections.push(
        `## Suggested next steps (nothing runs without a destructive flag + confirmation)\n${suggestions.map((s) => `- \`${s.flag}\`: ${s.text}`).join('\n')}`,
      );
    }
    return sections.join('\n\n');
  })();
  try {
    writeFileSync(SIDECAR_PATH, `${markdownReport}\n`);
  } catch (error) {
    console.error(`(could not write sidecar report: ${error.message})`);
  }

  // Checkouts with uncommitted work are listed for human review (see below).
  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
    return 0;
  }

  if (opts.markdown) {
    console.log(markdownReport);
    return 0;
  }

  console.log(
    `\nWorktree audit: ${opts.allRepos ? 'all repos' : REPO_ROOT}${opts.nodeModulesOnly ? ' (node_modules reclaim only)' : ''}`,
  );
  console.log(`Markdown report: ${SIDECAR_PATH}`);
  for (const repo of repos) {
    if (opts.nodeModulesOnly) printReclaim(repo);
    else printRepo(repo);
  }

  if (opts.nodeModulesOnly) {
    console.log(
      `\ntotals: ${formatSize(clearableKb)} reclaimable node_modules in ${clearableTargets.length} worktree(s) (mains excluded)`,
    );
  } else {
    console.log(
      `\ntotals: ${totals.repos} repo(s), ${totals.gitWorktrees} worktree(s) + ${totals.orphans} orphan(s) = ${formatSize(totals.totalKb)} (${formatSize(totals.orphanKb)} orphaned)`,
    );
  }
  if (dirtyCheckouts.length > 0) {
    console.log(
      `\nneeds review (${dirtyCheckouts.length} with uncommitted changes — never auto-deleted, open in VS Code):`,
    );
    for (const w of dirtyCheckouts) console.log(`  code ${w.path}`);
  }
  if (suggestions.length > 0) {
    console.log('\nsuggested next steps (nothing runs without a destructive flag + confirmation):');
    const width = Math.max(...suggestions.map((s) => s.flag.length));
    for (const s of suggestions) console.log(`  ${s.flag.padEnd(width)}  ${s.text}`);
  }

  let failures = 0;
  const destructive = opts.deleteOrphans || opts.deleteMerged || opts.clearNodeModules || opts.remove.length > 0;
  if (!destructive) {
    return 0;
  }

  // Phase 1 — plan: collect every destructive action with its exact command.
  // Nothing runs here; refusals and dirty-skips are reported, not planned.
  const plan = [];
  if (opts.deleteOrphans) {
    console.log(`\nplanned orphan removal (${allOrphans.length} candidate(s)):`);
    if (allOrphans.length === 0) console.log('  (none)');
    for (const o of allOrphans) {
      if (!isDeletable(o.path, scope)) {
        console.warn(`  (refuse, outside deletable scope: ${o.path})`);
        failures += 1;
        continue;
      }
      if ((o.dirtyFiles ?? 0) > 0) {
        console.warn(`  (skip, ${o.dirtyFiles} uncommitted file(s): ${o.path} — review first: code ${o.path})`);
        continue;
      }
      plan.push({ kind: 'remove', path: o.path, repoCwd: o.repoCwd, sizeKb: o.sizeKb });
    }
  }

  if (opts.deleteMerged) {
    console.log(`\nplanned merged-worktree removal (${mergedCandidates.length} candidate(s)):`);
    if (mergedCandidates.length === 0) console.log('  (none)');
    for (const w of mergedCandidates) {
      if (!isDeletable(w.path, scope)) {
        console.warn(`  (refuse, outside deletable scope: ${w.path})`);
        failures += 1;
        continue;
      }
      if (w.dirtyFiles > 0) {
        console.warn(`  (skip, ${w.dirtyFiles} uncommitted file(s): ${w.path} — review first: code ${w.path})`);
        continue;
      }
      plan.push({ kind: 'remove', path: w.path, repoCwd: w.repoCwd, sizeKb: w.sizeKb });
    }
  }

  if (opts.clearNodeModules) {
    console.log(`\nplanned node_modules removal in ${clearableTargets.length} worktree(s) (mains excluded):`);
    if (clearableTargets.length === 0) console.log('  (none)');
    for (const w of clearableTargets) {
      plan.push({ kind: 'clear-node-modules', path: path.join(w.path, 'node_modules'), sizeKb: w.nodeModulesKb });
    }
  }

  if (opts.remove.length > 0) {
    console.log(`\nplanned explicit removal (${opts.remove.length} path(s)):`);
    for (const target of opts.remove) {
      let abs = path.resolve(target);
      if (!existsSync(abs)) {
        // Fall back to worktree name matching: directory basename or branch,
        // exact match only. Ambiguous names are refused — use a full path.
        const matches = [...allWorktrees, ...allOrphans].filter(
          (w) => path.basename(w.path) === target || w.branch === target,
        );
        if (matches.length === 0) {
          console.warn(`  (skip, missing: ${target})`);
          failures += 1;
          continue;
        }
        if (matches.length > 1) {
          console.warn(`  (refuse, ambiguous name '${target}' matches:`);
          for (const m of matches) console.warn(`    - ${m.path}`);
          console.warn('  use a full path instead)');
          failures += 1;
          continue;
        }
        abs = path.resolve(matches[0].path);
      }
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
      // Never delete checkouts with uncommitted work, even when explicitly
      // named: refuse and point at VS Code review instead.
      const dirty = owner?.dirtyFiles ?? 0;
      if (dirty > 0) {
        console.warn(`  (refuse, ${dirty} uncommitted file(s) — review first: code ${abs})`);
        failures += 1;
        continue;
      }
      plan.push({
        kind: 'remove',
        path: abs,
        repoCwd: owner?.repoCwd ?? path.dirname(abs),
        sizeKb: dirSizeKb(abs),
      });
    }
  }

  // Resolve each removal to the exact command that will run, so the preview
  // shows `git worktree remove` vs `rm -rf` truthfully.
  for (const item of plan) {
    if (item.kind === 'remove') {
      const tracked = item.repoCwd ? gitIn(item.repoCwd, 'worktree list --porcelain').includes(item.path) : false;
      item.command = tracked ? `git -C ${item.repoCwd} worktree remove --force ${item.path}` : `rm -rf ${item.path}`;
    } else {
      item.command = `rm -rf ${item.path}`;
    }
  }
  const pruneCwds =
    plan.length > 0
      ? repos
          .filter((repo) => repo.gitAvailable)
          .map((repo) => ({ repo: repo.name, cwd: repo.probeCwd ?? repo.dirs[0] }))
          .filter((p) => p.cwd)
      : [];
  const actionCount = plan.length + pruneCwds.length;

  // Phase 2 — preview: every exact command, visible before anything runs.
  if (actionCount === 0) {
    console.log('\nnothing to do.');
    return failures === 0 ? 0 : 1;
  }
  console.log(`\nplanned actions (${plan.length} destructive + ${pruneCwds.length} prune):`);
  for (const item of plan) console.log(`  ${formatSize(item.sizeKb).padStart(6)}  $ ${item.command}`);
  for (const p of pruneCwds) console.log(`           $ git -C ${p.cwd} worktree prune (${p.repo})`);

  // Phase 3 — confirm: typed acceptance, unless preview-only or pre-approved.
  if (opts.dryRun) {
    console.log('\n(dry-run) preview only — no changes made.');
    return failures === 0 ? 0 : 1;
  }
  if (opts.yes) {
    console.log('\nConfirmed non-interactively via --yes.');
  } else if (process.stdin.isTTY !== true) {
    console.error(
      '\nRefusing destructive actions without an interactive terminal. Re-run with --dry-run to preview, or pass --yes to confirm non-interactively.',
    );
    return 1;
  } else if (!(await confirmActions(actionCount))) {
    console.log('Aborted — no changes made.');
    return 1;
  }

  // Phase 4 — execute: echo each command as it runs.
  for (const item of plan) {
    if (item.kind === 'remove') {
      if (!runRemove(item)) failures += 1;
    } else {
      console.log(`$ rm -rf ${item.path}`);
      try {
        rmSync(item.path, { recursive: true, force: true });
        console.log(`  cleared: ${item.path} (was ${formatSize(item.sizeKb)})`);
      } catch (error) {
        console.error(`  FAILED ${item.path}: ${error.message}`);
        failures += 1;
      }
    }
  }
  for (const p of pruneCwds) {
    console.log(`$ git -C ${p.cwd} worktree prune`);
    spawnSync('git', ['worktree', 'prune'], { cwd: p.cwd, stdio: 'inherit' });
  }
  console.log(failures === 0 ? '\nOK' : `\nDONE with ${failures} failure(s)`);
  return failures === 0 ? 0 : 1;
}

process.exit(await main());
