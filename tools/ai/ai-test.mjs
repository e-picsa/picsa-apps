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
 * Exit code is non-zero if any test run fails — including when a resolved spec
 * cannot be executed (no owning Nx project or no test target). Exits 0 with
 * guidance only when no covering specs exist at all (some files have no specs).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { detectChangedFiles, hasHelpFlag, REPO_ROOT, runCommand } from './_shared.mjs';

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
  yarn nx test <project> --testFile=<spec project-relative path>`);
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

function parseArgs(rawArgs) {
  const dryRun = rawArgs.includes('--dry-run');
  // Everything after `--` is forwarded to each `nx test` invocation
  const separatorIndex = rawArgs.indexOf('--');
  const passthrough = separatorIndex >= 0 ? rawArgs.slice(separatorIndex + 1) : [];
  const ownArgs = (separatorIndex >= 0 ? rawArgs.slice(0, separatorIndex) : rawArgs).filter((a) => a !== '--dry-run');
  return { dryRun, passthrough, ownArgs };
}

/** Split candidates into runnable specs and files without a covering spec. */
function resolveSpecs(candidates) {
  const specs = [...new Set(candidates.map(toSpecFile).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const withoutSpecs = candidates.filter((f) => !toSpecFile(f));
  return { specs, withoutSpecs };
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

/**
 * Run one spec via its owning Nx project. A resolved spec that cannot be
 * executed (no owning project or no test target) is a failure — silently
 * skipping it would let verification report success without testing anything.
 */
function runSpec(spec, passthrough, dryRun) {
  const project = findOwningProject(spec);
  if (!project) {
    console.error(`\n(ai-test: no owning Nx project found for ${spec})`);
    return 1;
  }
  if (!project.hasTest) {
    console.error(`\n(ai-test: project "${project.name}" has no test target for ${spec})`);
    return 1;
  }
  const projectRelative = path.relative(project.root, spec).split(path.sep).join('/');
  return runCommand('yarn', ['nx', 'test', project.name, `--testFile=${projectRelative}`, ...passthrough], {
    dryRun,
  });
}

function runSpecs(specs, passthrough, dryRun) {
  let status = 0;
  for (const spec of specs) {
    status = runSpec(spec, passthrough, dryRun) || status;
  }
  return status;
}

function reportNoSpecs(candidates) {
  console.log('ai-test: no covering *.spec.ts found for changed files:');
  for (const f of candidates) console.log(`  - ${f}`);
  console.log('\nGuidance: specs are colocated next to source (e.g. foo.spec.ts next to foo.ts).');
  console.log('If the change has no coverable logic, no test run is required.');
}

function main() {
  const rawArgs = process.argv.slice(2);
  if (hasHelpFlag(rawArgs)) {
    printHelp();
    return 0;
  }
  const { dryRun, passthrough, ownArgs } = parseArgs(rawArgs);
  const candidates = ownArgs.length > 0 ? ownArgs : detectChangedFiles();
  if (candidates.length === 0) {
    console.log('ai-test: no changed files detected (working tree clean vs HEAD). Pass explicit paths if needed.');
    return 0;
  }

  const { specs, withoutSpecs } = resolveSpecs(candidates);
  if (specs.length === 0) {
    reportNoSpecs(candidates);
    return 0;
  }

  console.log(`ai-test: ${specs.length} spec(s) from ${candidates.length} changed file(s)`);
  if (withoutSpecs.length > 0) {
    console.log('Changed files without a covering spec (skipped):');
    for (const f of withoutSpecs) console.log(`  - ${f}`);
  }

  const status = runSpecs(specs, passthrough, dryRun);
  console.log(status === 0 ? '\nai-test: OK' : '\nai-test: FAILED (see errors above)');
  return status;
}

process.exit(main());
