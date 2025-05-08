import { backupStorage } from './backup-storage';

async function backup() {
  await backupStorage();
}

backup();
