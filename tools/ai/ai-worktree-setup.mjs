#!/usr/bin/env node
/**
 * AI worktree setup helper.
 *
 * Run once when a new git worktree is created. It:
 *   1. Copies git-ignored local files (env configs, firebase/supabase secrets)
 *      from the main checkout into the worktree (fresh worktrees never contain them).
 *   2. Runs `yarn install --immutable` in the worktree.
 *   3. Writes a fingerprint file (`.ai-worktree-setup.json`, git-ignored) so
 *      agents and automated clients can detect that setup already ran.
 *
 * Usage:
 *   yarn ai:setup                  # full setup (copy files + install + fingerprint)
 *   yarn ai:setup --force          # re-run even if the fingerprint already exists
 *   yarn ai:setup --overwrite      # overwrite existing worktree files when copying
 *   yarn ai:setup --skip-install   # only copy files (no fingerprint is written)
 *   yarn ai:setup --main <path>    # copy from an explicit checkout instead of git detection
 *   yarn ai:setup --dry-run        # print what would happen without executing
 *
 * The script is idempotent: if the fingerprint exists it exits successfully
 * without doing anything (unless `--force` is passed), so automated clients
 * can safely invoke it unconditionally on worktree initialisation.
 */
import { execSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FINGERPRINT_FILENAME = '.ai-worktree-setup.json';
const FINGERPRINT_VERSION = 1;

// Git-ignored local files required to build/run, copied from the main checkout.
// Each is only copied when it exists in the source checkout.
const FILES_FROM_MAIN = [
  'apps/picsa-apps/app-native/android/app/google-services.json',
  'apps/picsa-scripts/.env',
  'apps/picsa-server/.env.local',
  'apps/picsa-server/supabase/functions/.env.local',
  'libs/environments/src/supabase/supabase.config.json',
];

function printHelp() {
  console.log(`ai-worktree-setup: initialise a fresh git worktree

Usage:
  yarn ai:setup [options]

Options:
  --force        Re-run even if the setup fingerprint already exists
  --overwrite    Overwrite existing worktree files when copying (default: keep them)
  --skip-install Only copy files, skip yarn install (no fingerprint is written)
  --main <path>  Copy from an explicit checkout instead of auto-detecting the main repo
  --dry-run      Print what would happen without executing
  -h, --help     Show this help

Copies git-ignored env/config files from the main checkout, runs
\`yarn install --immutable\`, and writes a ${FINGERPRINT_FILENAME} fingerprint.`);
}

function gitOutput(args, cwd) {
  try {
    return execSync(`git ${args}`, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

/** Resolve the current worktree root and the main checkout root. */
function resolveRoots(explicitMain) {
  const worktreeRoot = gitOutput('rev-parse --show-toplevel', SCRIPT_DIR) || path.resolve(SCRIPT_DIR, '..', '..');
  let mainRoot = explicitMain ? path.resolve(explicitMain) : '';
  if (!mainRoot) {
    const commonDir = gitOutput('rev-parse --git-common-dir', worktreeRoot);
    if (commonDir) {
      const absCommon = path.isAbsolute(commonDir) ? commonDir : path.join(worktreeRoot, commonDir);
      // In a linked worktree --git-common-dir points at the main repo's .git dir
      if (path.basename(absCommon) === '.git') {
        mainRoot = path.dirname(absCommon);
      } else {
        mainRoot = worktreeRoot;
      }
    } else {
      mainRoot = worktreeRoot;
    }
  }
  return { worktreeRoot, mainRoot };
}

function readFingerprint(worktreeRoot) {
  const fingerprintPath = path.join(worktreeRoot, FINGERPRINT_FILENAME);
  if (!existsSync(fingerprintPath)) return null;
  try {
    return JSON.parse(readFileSync(fingerprintPath, 'utf8'));
  } catch {
    return null;
  }
}

function copyFilesFromMain({ worktreeRoot, mainRoot, overwrite, dryRun }) {
  const copied = [];
  const skipped = [];
  if (worktreeRoot === mainRoot) {
    console.log('Not a linked worktree (this is the main checkout) — nothing to copy.');
    return { copied, skipped };
  }
  console.log(`Copying local files from main checkout:\n  ${mainRoot}`);
  for (const rel of FILES_FROM_MAIN) {
    const src = path.join(mainRoot, rel);
    const dest = path.join(worktreeRoot, rel);
    if (!existsSync(src)) {
      console.log(`  (skip, missing in main checkout: ${rel})`);
      skipped.push({ file: rel, reason: 'missing-in-main' });
      continue;
    }
    if (existsSync(dest) && !overwrite) {
      console.log(`  (keep existing: ${rel})`);
      skipped.push({ file: rel, reason: 'already-exists' });
      continue;
    }
    console.log(`  copy: ${rel}`);
    if (!dryRun) {
      mkdirSync(path.dirname(dest), { recursive: true });
      copyFileSync(src, dest);
    }
    copied.push(rel);
  }
  return { copied, skipped };
}

function runInstall(worktreeRoot, dryRun) {
  console.log(`\n$ yarn install --immutable`);
  if (dryRun) return 0;
  const result = spawnSync('yarn', ['install', '--immutable'], { cwd: worktreeRoot, stdio: 'inherit' });
  return result.status ?? 1;
}

function main() {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.includes('-h') || rawArgs.includes('--help')) {
    printHelp();
    return 0;
  }
  const force = rawArgs.includes('--force');
  const overwrite = rawArgs.includes('--overwrite');
  const skipInstall = rawArgs.includes('--skip-install');
  const dryRun = rawArgs.includes('--dry-run');
  const mainIndex = rawArgs.indexOf('--main');
  const explicitMain = mainIndex >= 0 ? rawArgs[mainIndex + 1] : '';
  if (mainIndex >= 0 && !explicitMain) {
    console.error('ai-setup: --main requires a path argument.');
    return 1;
  }

  const { worktreeRoot, mainRoot } = resolveRoots(explicitMain);
  console.log(`ai-setup: worktree ${worktreeRoot}\n          main     ${mainRoot}`);

  const existing = readFingerprint(worktreeRoot);
  if (existing && !force && !dryRun) {
    console.log(
      `ai-setup: already initialised (${existing.installedAt ?? 'unknown date'}). Use --force to re-run.`,
    );
    return 0;
  }
  if (existing && !force && dryRun) {
    console.log('ai-setup: fingerprint exists — a real run would exit here (use --force to re-run).');
  }

  const { copied, skipped } = copyFilesFromMain({ worktreeRoot, mainRoot, overwrite, dryRun });

  if (skipInstall) {
    console.log('\nai-setup: --skip-install, not running yarn install and not writing a fingerprint.');
    console.log('Run the full `yarn ai:setup` (or with --force) to complete initialisation.');
    return 0;
  }

  const status = runInstall(worktreeRoot, dryRun);
  if (status !== 0) {
    console.log('\nai-setup: FAILED (yarn install failed — fix and re-run, fingerprint not written)');
    return status;
  }

  const fingerprint = {
    version: FINGERPRINT_VERSION,
    installedAt: new Date().toISOString(),
    install: 'immutable',
    worktree: worktreeRoot,
    mainRepo: mainRoot,
    copied,
    skipped,
  };
  if (!dryRun) {
    writeFileSync(path.join(worktreeRoot, FINGERPRINT_FILENAME), `${JSON.stringify(fingerprint, null, 2)}\n`);
  }
  console.log(`\nai-setup: OK (fingerprint written to ${FINGERPRINT_FILENAME})`);
  return 0;
}

process.exit(main());
