#!/usr/bin/env node
/**
 * AI agent test helper.
 *
 * Runs ONLY the unit tests covering files the agent modified, resolving each
 * changed file to its colocated `*.spec.ts` and invoking the owning Nx project
 * with `nx test <project> --testFile=<spec>`.
 *
 * Test specs in this repo are colocated next to the source they cover
 * (e.g. `libs/utils/climate.utils.spec.ts` next to `climate.utils.ts`).
 *
 * Usage:
 *   yarn ai:test                    # auto-detect changed files vs HEAD, run covering specs
 *   yarn ai:test <files...>         # map explicit source/spec files to specs and run them
 *   yarn ai:test --dry-run          # print what would run without executing
 *   yarn ai:test -- <extra nx args> # forward extra args to each `nx test` call
 *
 * Exit code is non-zero if any test run fails. Exits 0 with guidance when no
 * covering specs are found (that is not a failure — some files have no specs).
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROJECT_SCAN_ROOTS = ['apps', 'libs'];

function printHelp() {
  console.log(`ai-test: run only the unit tests covering agent-modified files

Usage:
  yarn ai:test [options] [files...] [-- <extra nx test args>]

Options:
  --dry-run   Print commands without executing
  -h, --help  Show this help

With no file args, changed files (staged + unstaged + untracked vs HEAD) are
auto-detected. Each source file maps to its colocated *.spec.ts; spec files
passed directly run as-is. Each spec runs via its owning Nx project:
  yarn nx test <project> --testFile=<spec basename>`);
}

function gitOutput(args) {
  try {
    return execSync(`git ${args}`, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

/** Files changed vs HEAD, covering staged + unstaged + untracked. */
function detectChangedFiles() {
  const raw = gitOutput('diff --name-only HEAD --diff-filter=ACMR');
  const tracked = raw ? raw.split('\n').map((f) => f.trim()).filter(Boolean) : [];
  // `ls-files --others` expands untracked directories into individual files (unlike `status --porcelain`)
  const untrackedRaw = gitOutput('ls-files --others --exclude-standard');
  const untracked = untrackedRaw ? untrackedRaw.split('\n').map((f) => f.trim()).filter(Boolean) : [];
  return [...new Set([...tracked, ...untracked])];
}

/** Map a changed file to its covering spec (repo-relative), or null. */
function toSpecFile(file) {
  const rel = path.isAbsolute(file) ? path.relative(REPO_ROOT, file) : file;
  if (!rel.endsWith('.ts')) return null;
  if (rel.endsWith('.spec.ts')) {
    return existsSync(path.join(REPO_ROOT, rel)) ? rel : null;
  }
  const spec = rel.replace(/\.ts$/, '.spec.ts');
  return existsSync(path.join(REPO_ROOT, spec)) ? spec : null;
}

/** Recursively find all project.json files under the scan roots. */
function findProjectJsons() {
  const found = [];
  const walk = (dir, depth) => {
    if (depth > 6) return;
    let entries = [];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry === 'node_modules' || entry === '.git' || entry.startsWith('.')) continue;
      const abs = path.join(dir, entry);
      let stat = null;
      try {
        stat = statSync(abs);
      } catch {
        continue;
      }
      if (stat.isFile() && entry === 'project.json') found.push(abs);
      else if (stat.isDirectory()) walk(abs, depth + 1);
    }
  };
  for (const root of PROJECT_SCAN_ROOTS) walk(path.join(REPO_ROOT, root), 0);
  return found;
}

let projectCache = null;
function loadProjects() {
  if (projectCache) return projectCache;
  projectCache = [];
  for (const abs of findProjectJsons()) {
    try {
      const json = JSON.parse(readFileSync(abs, 'utf8'));
      if (!json.name) continue;
      const projectRoot = path.relative(REPO_ROOT, path.dirname(abs));
      projectCache.push({ name: json.name, root: projectRoot, hasTest: Boolean(json.targets?.test) });
    } catch {
      // Ignore unreadable project files
    }
  }
  // Longest root first so nested projects win
  projectCache.sort((a, b) => b.root.length - a.root.length);
  return projectCache;
}

/** Find the owning Nx project for a repo-relative spec path. */
function findOwningProject(specRel) {
  const projects = loadProjects();
  const normalised = specRel.split(path.sep).join('/');
  return projects.find((p) => normalised === p.root || normalised.startsWith(`${p.root}/`)) ?? null;
}

function run(cmd, args, dryRun) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  if (dryRun) return 0;
  const result = spawnSync(cmd, args, { cwd: REPO_ROOT, stdio: 'inherit' });
  return result.status ?? 1;
}

function main() {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.includes('-h') || rawArgs.includes('--help')) {
    printHelp();
    return 0;
  }
  const dryRun = rawArgs.includes('--dry-run');
  // Everything after `--` is forwarded to each `nx test` invocation
  const separatorIndex = rawArgs.indexOf('--');
  const passthrough = separatorIndex >= 0 ? rawArgs.slice(separatorIndex + 1) : [];
  const ownArgs = (separatorIndex >= 0 ? rawArgs.slice(0, separatorIndex) : rawArgs).filter((a) => a !== '--dry-run');

  const candidates = ownArgs.length > 0 ? ownArgs : detectChangedFiles();
  if (candidates.length === 0) {
    console.log('ai-test: no changed files detected (working tree clean vs HEAD). Pass explicit paths if needed.');
    return 0;
  }

  const specs = [...new Set(candidates.map(toSpecFile).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const withoutSpecs = candidates.filter((f) => !toSpecFile(f));

  if (specs.length === 0) {
    console.log('ai-test: no covering *.spec.ts found for changed files:');
    for (const f of candidates) console.log(`  - ${f}`);
    console.log('\nGuidance: specs are colocated next to source (e.g. foo.spec.ts next to foo.ts).');
    console.log('If the change has no coverable logic, no test run is required.');
    return 0;
  }

  console.log(`ai-test: ${specs.length} spec(s) from ${candidates.length} changed file(s)`);
  if (withoutSpecs.length > 0) {
    console.log('Changed files without a covering spec (skipped):');
    for (const f of withoutSpecs) console.log(`  - ${f}`);
  }

  let status = 0;
  for (const spec of specs) {
    const project = findOwningProject(spec);
    if (!project) {
      console.warn(`\n(ai-test: skip ${spec} — no owning Nx project found)`);
      continue;
    }
    if (!project.hasTest) {
      console.warn(`\n(ai-test: skip ${spec} — project "${project.name}" has no test target)`);
      continue;
    }
    status =
      run('yarn', ['nx', 'test', project.name, `--testFile=${path.basename(spec)}`, ...passthrough], dryRun) || status;
  }

  console.log(status === 0 ? '\nai-test: OK' : '\nai-test: FAILED (see errors above)');
  return status;
}

process.exit(main());
