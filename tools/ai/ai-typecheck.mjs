#!/usr/bin/env node
/**
 * AI agent typecheck helper.
 *
 * Runs fast, non-emitting TypeScript and Angular template type checks on
 * projects affected by modified files WITHOUT running full production builds.
 *
 * Uses `ngc --noEmit` (Angular Compiler CLI) which validates BOTH TypeScript
 * contracts and Angular HTML templates in 1-2 seconds per project, skipping
 * all asset bundling, Sass compilation, terser minification, and packaging.
 *
 * Usage:
 *   yarn ai:typecheck                 # auto-detect changed files vs HEAD & typecheck affected projects
 *   yarn ai:typecheck <project/file>  # typecheck specific project(s) or owning project(s) of given files
 *   yarn ai:typecheck --dry-run       # print what would run without executing
 *   yarn ai:typecheck -h, --help      # show help
 *
 * Exit code is non-zero if any project fails type checking.
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { detectChangedFiles, hasHelpFlag, REPO_ROOT, runCommand } from './_shared.mjs';

const PROJECT_SCAN_ROOTS = ['apps', 'libs'];
const EXCLUDED_PROJECTS = new Set(['picsa-scripts', 'picsa-apps-app-native-e2e']);

function printHelp() {
  console.log(`ai-typecheck: fast typecheck on projects affected by agent modifications

Usage:
  yarn ai:typecheck [options] [projects/files...]

Options:
  --dry-run   Print commands without executing
  -h, --help  Show this help

When run without arguments, detected changed files vs HEAD are mapped to their
owning and affected Nx projects, and validated using Angular compiler / TypeScript:
  yarn ngc -p <tsconfig> --noEmit
`);
}

/** Recursively find all project.json files under scan roots. */
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
      if (!json.name || EXCLUDED_PROJECTS.has(json.name)) continue;
      const projectRoot = path.relative(REPO_ROOT, path.dirname(abs)).split(path.sep).join('/');
      // Determine best tsconfig
      let tsConfig = null;
      const candidates = ['tsconfig.app.json', 'tsconfig.lib.json', 'tsconfig.json'];
      for (const candidate of candidates) {
        const fullCandidate = path.join(REPO_ROOT, projectRoot, candidate);
        if (existsSync(fullCandidate)) {
          tsConfig = path.relative(REPO_ROOT, fullCandidate).split(path.sep).join('/');
          break;
        }
      }
      projectCache.push({
        name: json.name,
        root: projectRoot,
        tsConfig,
      });
    } catch {
      // Ignore unreadable project files
    }
  }
  // Sort longest root first for accurate path matching
  projectCache.sort((a, b) => b.root.length - a.root.length);
  return projectCache;
}

function findOwningProjectForFile(filePath) {
  const projects = loadProjects();
  const rel = (path.isAbsolute(filePath) ? path.relative(REPO_ROOT, filePath) : filePath)
    .split(path.sep)
    .join('/');
  return projects.find((p) => rel === p.root || rel.startsWith(`${p.root}/`)) ?? null;
}

function getAffectedProjectNames() {
  try {
    const raw = execSync('yarn -s nx show projects --affected', {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: { ...process.env, NX_SOCKET_DIR: '/tmp/nx-tmp', NX_DAEMON: 'false' },
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return raw ? raw.split('\n').map((l) => l.trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function resolveProjectsToCheck(explicitArgs) {
  const allProjects = loadProjects();
  const projectMapByName = new Map(allProjects.map((p) => [p.name, p]));

  if (explicitArgs.length > 0) {
    const matched = new Set();
    for (const arg of explicitArgs) {
      if (projectMapByName.has(arg)) {
        matched.add(projectMapByName.get(arg));
      } else {
        const owning = findOwningProjectForFile(arg);
        if (owning) matched.add(owning);
      }
    }
    return [...matched];
  }

  const changedFiles = detectChangedFiles();
  if (changedFiles.length === 0) return [];

  // Filter to TS/HTML changes
  const relevantFiles = changedFiles.filter((f) => /\.(ts|html)$/i.test(f));
  if (relevantFiles.length === 0) return [];

  // Check if any change touched shared libs
  const hasLibChanges = relevantFiles.some((f) => f.startsWith('libs/'));

  if (hasLibChanges) {
    // If libraries were modified, use Nx affected to catch all downstream dependents
    const affectedNames = new Set(getAffectedProjectNames());
    const matched = allProjects.filter((p) => affectedNames.has(p.name) && p.tsConfig);
    if (matched.length > 0) return matched;
  }

  // Otherwise, only check the directly owning projects
  const directProjects = new Set();
  for (const f of relevantFiles) {
    const owning = findOwningProjectForFile(f);
    if (owning && owning.tsConfig) {
      directProjects.add(owning);
    }
  }
  return [...directProjects];
}

function main() {
  const rawArgs = process.argv.slice(2);
  if (hasHelpFlag(rawArgs)) {
    printHelp();
    return 0;
  }

  const dryRun = rawArgs.includes('--dry-run');
  const explicitArgs = rawArgs.filter((a) => !a.startsWith('-'));

  const projectsToCheck = resolveProjectsToCheck(explicitArgs);

  if (projectsToCheck.length === 0) {
    console.log('ai-typecheck: no relevant TypeScript / Angular changes detected to typecheck.');
    return 0;
  }

  console.log(`ai-typecheck: checking ${projectsToCheck.length} project(s):`);
  for (const p of projectsToCheck) {
    console.log(`  - ${p.name} (${p.tsConfig})`);
  }

  let failed = 0;
  for (const p of projectsToCheck) {
    console.log(`\n--> Typechecking ${p.name}...`);
    const status = runCommand('yarn', ['ngc', '-p', p.tsConfig, '--noEmit'], { dryRun });
    if (status !== 0) {
      failed++;
    }
  }

  if (failed > 0) {
    console.error(`\nai-typecheck: FAILED (${failed} of ${projectsToCheck.length} project(s) had errors)`);
    return 1;
  }

  console.log(`\nai-typecheck: OK (${projectsToCheck.length} project(s) passed)`);
  return 0;
}

process.exit(main());
