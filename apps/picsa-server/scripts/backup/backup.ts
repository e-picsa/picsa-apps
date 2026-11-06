/**
 * Unified backup entry point: database (partial or full) plus storage,
 * each as a dated .tar.gz archive in `apps/picsa-server/backups/`:
 * `<date>_db.tar.gz`, `<date>_db_full.tar.gz`, `<date>_files.tar.gz`.
 * Same-day reruns overwrite.
 *
 * Invoke:
 *   yarn nx run picsa-server:backup [-- --full|--partial] [--no-db] [--no-storage]
 *
 * Flags:
 *   --full        Full docs-recipe DB dump (roles, schema, data, migration
 *                 history) instead of the partial app-schema dump.
 *   --partial     Partial app-schema dump (explicit form of the default).
 *                 If neither --full nor --partial is given, prompts
 *                 interactively (defaults to partial when non-interactive).
 *   --no-db       Skip the database dump (storage only).
 *   --no-storage  Skip storage (database only).
 *
 * Requires: whatever the selected parts need - see backup-db.ts,
 * backup-db-full.ts and backup-storage.ts.
 */
import fs from 'fs';
import readline from 'readline';

import { backupDatabase } from './backup-db';
import { backupDatabaseFull } from './backup-db-full';
import { backupStorage } from './backup-storage';
import {
  archiveAndClean,
  backupRootDir,
  datedStamp,
  dbArchiveName,
  filesArchiveName,
  stagingDir,
} from './backup.utils';

async function backup() {
  const args = process.argv.slice(2);
  const full = await resolveFullFlag(args);
  const includeDb = !args.includes('--no-db');
  const includeStorage = !args.includes('--no-storage');

  if (!includeDb && !includeStorage) {
    console.error('\n❌ Error: nothing to back up (--no-db and --no-storage combined).\n');
    process.exit(1);
  }

  if (!fs.existsSync(backupRootDir)) {
    fs.mkdirSync(backupRootDir, { recursive: true });
  }

  const stamp = datedStamp();

  if (includeDb) {
    const stageDir = stagingDir(full ? 'db_full' : 'db');
    fs.mkdirSync(stageDir, { recursive: true });
    if (full) {
      await backupDatabaseFull(stageDir);
    } else {
      await backupDatabase(stageDir);
    }
    await archiveAndClean(stageDir, `${backupRootDir}/${dbArchiveName(full)}`);
    console.log(`   Archive: ${stamp}_db${full ? '_full' : ''}.tar.gz`);
  }

  if (includeStorage) {
    await backupStorage(`${backupRootDir}/${filesArchiveName()}`);
  }

  console.log('\n✅ Backup completed successfully.');
}

/** --full/--partial flags win; otherwise prompt (default partial when non-interactive). */
async function resolveFullFlag(args: string[]): Promise<boolean> {
  if (args.includes('--full')) return true;
  if (args.includes('--partial')) return false;
  if (!process.stdin.isTTY) {
    console.log('Non-interactive shell - defaulting to partial backup (use --full for full).');
    return false;
  }
  const answer = await prompt('Full or partial database backup? [partial/full] (default: partial): ');
  return answer.trim().toLowerCase().startsWith('f');
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    }),
  );
}

if (require.main === module) {
  void backup();
}
