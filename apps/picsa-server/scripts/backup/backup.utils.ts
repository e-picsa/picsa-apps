import fs from 'fs';
import path from 'path';

import { zipFolderContents } from '../utils/file.utils';

/** Dated archives live here: `apps/picsa-server/backups/` */
export const backupRootDir = path.resolve(__dirname, '../../backups');

/** Date stamp used in archive names: `2026_11_07` */
export function datedStamp(date = new Date()): string {
  return date.toISOString().substring(0, 10).replace(/-/g, '_');
}

export function dbArchiveName(full: boolean, date = new Date()): string {
  return `${datedStamp(date)}_db${full ? '_full' : ''}.tar.gz`;
}

export function filesArchiveName(date = new Date()): string {
  return `${datedStamp(date)}_files.tar.gz`;
}

/** Compress a staging folder into a .tar.gz archive and remove the folder. */
export async function archiveAndClean(dir: string, archivePath: string): Promise<void> {
  await zipFolderContents(dir, archivePath);
  await fs.promises.rm(dir, { recursive: true, force: true });
  console.log(`Archived to ${archivePath}`);
}

/** Staging folder for database dumps, removed after archiving. */
export function stagingDir(kind: 'db' | 'db_full', date = new Date()): string {
  return path.join(backupRootDir, `.stage-${kind}-${datedStamp(date)}`);
}
