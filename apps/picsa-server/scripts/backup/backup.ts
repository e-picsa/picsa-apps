import { backupDatabase } from './backup-db';
import { backupStorage } from './backup-storage';

async function backup() {
  await backupDatabase();
  await backupStorage();
}

backup();
