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
import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

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

function gitOutput(args) {
  try {
    return execSync(`git ${args}`, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

/** Files changed vs HEAD, covering staged + unstaged + untracked. */
function detectChangedFiles(stagedOnly) {
  const raw = stagedOnly ? gitOutput('diff --cached --name-only --diff-filter=ACMR') : gitOutput('diff --name-only HEAD --diff-filter=ACMR');
  const tracked = raw ? raw.split('\n').map((f) => f.trim()).filter(Boolean) : [];
  if (stagedOnly) return tracked;
  // `ls-files --others` expands untracked directories into individual files (unlike `status --porcelain`)
  const untrackedRaw = gitOutput('ls-files --others --exclude-standard');
  const untracked = untrackedRaw ? untrackedRaw.split('\n').map((f) => f.trim()).filter(Boolean) : [];
  return [...new Set([...tracked, ...untracked])];
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
  const check = rawArgs.includes('--check');
  const dryRun = rawArgs.includes('--dry-run');
  const stagedOnly = rawArgs.includes('--staged');
  const explicitFiles = rawArgs.filter((a) => !a.startsWith('-'));

  const candidates = explicitFiles.length > 0 ? explicitFiles : detectChangedFiles(stagedOnly);
  // Normalise to repo-relative paths and drop deleted/missing entries
  const files = [...new Set(candidates.map((f) => f.trim()).filter(Boolean))].filter((f) => {
    const abs = path.isAbsolute(f) ? f : path.join(REPO_ROOT, f);
    if (!existsSync(abs)) {
      console.warn(`  (skip missing/deleted: ${f})`);
      return false;
    }
    return true;
  });

  if (files.length === 0) {
    console.log(
      stagedOnly
        ? 'ai-lint: no staged files found. Stage changes first or run without --staged.'
        : 'ai-lint: no changed files detected (working tree clean vs HEAD). Pass explicit paths if needed.',
    );
    return 0;
  }

  console.log(`ai-lint: ${files.length} file(s)${explicitFiles.length > 0 ? ' (explicit)' : stagedOnly ? ' (staged)' : ' (changed vs HEAD)'}`);
  for (const f of files) console.log(`  - ${f}`);

  const prettierFiles = files.filter((f) => PRETTIER_EXTENSIONS.has(path.extname(f).toLowerCase()));
  const eslintFiles = files.filter((f) => ESLINT_EXTENSIONS.has(path.extname(f).toLowerCase()));

  let status = 0;
  if (prettierFiles.length > 0) {
    status = run('yarn', ['prettier', check ? '--check' : '--write', ...prettierFiles], dryRun) || status;
  } else {
    console.log('\n(ai-lint: no prettier-supported files, skipping prettier)');
  }

  if (eslintFiles.length > 0) {
    const args = check ? [...eslintFiles] : ['--fix', ...eslintFiles];
    status = run('yarn', ['eslint', ...args], dryRun) || status;
  } else {
    console.log('\n(ai-lint: no eslint-supported files, skipping eslint)');
  }

  console.log(status === 0 ? '\nai-lint: OK' : '\nai-lint: FAILED (see errors above)');
  return status;
}

process.exit(main());
