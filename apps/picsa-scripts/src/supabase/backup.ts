import { syncStorage } from './backup-storage';

async function backup() {
  await syncStorage();
}

backup();
