#!/usr/bin/env node
/**
 * AI agent lint helper.
 *
 * Lints files the agent has modified WITHOUT requiring them to be staged
 * (unlike `lint-staged`, which only sees staged files).
 *
 * Usage:
 *   yarn ai:lint                  # auto-detect changed files (staged + unstaged + untracked vs HEAD)
 *   yarn ai:lint <files...>       # lint explicit files
 *   yarn ai:lint --staged         # only staged files (lint-staged parity)
 *   yarn ai:lint --check          # verify only, no auto-fixing (no --write/--fix)
 *   yarn ai:lint --dry-run        # print what would run without executing
 *
 * What it runs (mirrors the repo `lint-staged` config in package.json):
 *   1. prettier --write (or --check) on supported files (*.ts, *.html, *.scss, *.json, *.md, ...)
 *   2. eslint --fix (or without --fix in --check mode) on *.ts / *.html files
 *
 * Exit code is non-zero if any step fails.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { detectChangedFiles, hasHelpFlag, REPO_ROOT, runCommand } from './_shared.mjs';

// Extensions prettier can format in this repo (kept in sync with lint-staged + common web files)
const PRETTIER_EXTENSIONS = new Set(['.ts', '.html', '.scss', '.css', '.json', '.md', '.js', '.mjs', '.cjs']);
// Extensions eslint covers here (lint-staged uses *.ts; angular templates benefit too)
const ESLINT_EXTENSIONS = new Set(['.ts', '.html']);

function printHelp() {
  console.log(`ai-lint: lint agent-modified files (no staging required)

Usage:
  yarn ai:lint [options] [files...]

Options:
  --staged    Only lint staged files (git diff --cached)
  --check     Verify only, skip auto-fixing (prettier --check, eslint without --fix)
  --dry-run   Print commands without executing
  -h, --help  Show this help

With no file args, lints all files changed vs HEAD (staged + unstaged + untracked).
Deleted files are skipped automatically.`);
}

function parseArgs(rawArgs) {
  return {
    check: rawArgs.includes('--check'),
    dryRun: rawArgs.includes('--dry-run'),
    stagedOnly: rawArgs.includes('--staged'),
    explicitFiles: rawArgs.filter((a) => !a.startsWith('-')),
  };
}

/** Drop deleted/missing entries, warning about each skip. */
function existingFiles(candidates) {
  return [...new Set(candidates.map((f) => f.trim()).filter(Boolean))].filter((f) => {
    const abs = path.isAbsolute(f) ? f : path.join(REPO_ROOT, f);
    if (!existsSync(abs)) {
      console.warn(`  (skip missing/deleted: ${f})`);
      return false;
    }
    return true;
  });
}

function describeSource(explicitFiles, stagedOnly) {
  if (explicitFiles.length > 0) return 'explicit';
  return stagedOnly ? 'staged' : 'changed vs HEAD';
}

function runPrettier(files, check, dryRun) {
  const targets = files.filter((f) => PRETTIER_EXTENSIONS.has(path.extname(f).toLowerCase()));
  if (targets.length === 0) {
    console.log('\n(ai-lint: no prettier-supported files, skipping prettier)');
    return 0;
  }
  return runCommand('yarn', ['prettier', check ? '--check' : '--write', ...targets], { dryRun });
}

function runEslint(files, check, dryRun) {
  const targets = files.filter((f) => ESLINT_EXTENSIONS.has(path.extname(f).toLowerCase()));
  if (targets.length === 0) {
    console.log('\n(ai-lint: no eslint-supported files, skipping eslint)');
    return 0;
  }
  const args = check ? [...targets] : ['--fix', ...targets];
  return runCommand('yarn', ['eslint', ...args], { dryRun });
}

function main() {
  const rawArgs = process.argv.slice(2);
  if (hasHelpFlag(rawArgs)) {
    printHelp();
    return 0;
  }
  const { check, dryRun, stagedOnly, explicitFiles } = parseArgs(rawArgs);
  const candidates = explicitFiles.length > 0 ? explicitFiles : detectChangedFiles({ stagedOnly });
  const files = existingFiles(candidates);

  if (files.length === 0) {
    if (stagedOnly) {
      console.log('ai-lint: no staged files found. Stage changes first or run without --staged.');
    } else {
      console.log('ai-lint: no changed files detected (working tree clean vs HEAD). Pass explicit paths if needed.');
    }
    return 0;
  }

  console.log(`ai-lint: ${files.length} file(s) (${describeSource(explicitFiles, stagedOnly)})`);
  for (const f of files) console.log(`  - ${f}`);

  let status = runPrettier(files, check, dryRun);
  status = runEslint(files, check, dryRun) || status;
  console.log(status === 0 ? '\nai-lint: OK' : '\nai-lint: FAILED (see errors above)');
  return status;
}

process.exit(main());
