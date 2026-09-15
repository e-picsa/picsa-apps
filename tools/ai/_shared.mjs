/**
 * Shared helpers for the `tools/ai/*.mjs` agent scripts.
 *
 * Zero dependencies (node builtins only) so the scripts run on fresh
 * worktrees before `yarn install` has ever executed.
 */
import { execSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repo root, resolved from this file's location (independent of cwd). */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function hasHelpFlag(rawArgs) {
  return rawArgs.includes('-h') || rawArgs.includes('--help');
}

/** Run a git subcommand, returning trimmed stdout (or '' on failure). */
export function gitOutput(args, cwd = REPO_ROOT) {
  try {
    return execSync(`git ${args}`, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function splitLines(output) {
  return output ? output.split('\n').map((line) => line.trim()).filter(Boolean) : [];
}

/**
 * Files changed vs HEAD, covering staged + unstaged + untracked.
 * Untracked entries come from `ls-files --others` so untracked directories
 * expand into individual files (unlike `status --porcelain`).
 */
export function detectChangedFiles({ stagedOnly = false } = {}) {
  const tracked = splitLines(
    gitOutput(stagedOnly ? 'diff --cached --name-only --diff-filter=ACMR' : 'diff --name-only HEAD --diff-filter=ACMR'),
  );
  if (stagedOnly) return tracked;
  const untracked = splitLines(gitOutput('ls-files --others --exclude-standard'));
  return [...new Set([...tracked, ...untracked])];
}

/** Print and (unless dryRun) execute a command, returning its exit status. */
export function runCommand(cmd, args, { cwd = REPO_ROOT, dryRun = false } = {}) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  if (dryRun) return 0;
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  return result.status ?? 1;
}
