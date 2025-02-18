import { Injectable, Injector } from '@angular/core';
import { MIGRATIONS } from './migrations';
import { IMigrationStatus } from './types';
import { APP_VERSION } from '@picsa/environments/src';

interface IMigrationMeta {
  first_install_version: number;
  history: Record<string, IMigrationStatus>;
}

@Injectable({ providedIn: 'root' })
export class PicsaMigrationService {
  private meta = this.loadMigrationMeta();

  public async runMigrations(injector: Injector): Promise<void> {
    console.group('[Migrations]');
    const { first_install_version } = this.meta;
    const pending = MIGRATIONS.filter(({ id, retryOnFail, app_version }) => {
      if (first_install_version >= parseSemverVersion(app_version)) {
        return false;
      }
      const history = this.meta.history[id];
      if (history && history.result) {
        return false;
      }
      if (history && history.error && !retryOnFail) {
        return false;
      }
      return true;
    });
    const timestamp = new Date().toLocaleString();
    if (pending.length > 0) {
      for (const { id, label, up } of pending) {
        console.log(`Exec ${id} - ${label}`);
        try {
          const result = await up(injector);
          this.meta.history[id] = { timestamp, result };
        } catch (error) {
          console.error('Failed', id, error);
          this.meta.history[id] = { timestamp, error: (error as any)?.message };
        }
      }
    }
    console.log('Complete', this.meta.history);
    console.groupEnd();

    this.saveMigrationHistory();
  }

  private saveMigrationHistory() {
    // Use timeout to avoid blocking other init operations
    setTimeout(() => {
      localStorage.setItem('picsa_migration_meta', JSON.stringify(this.meta));
    }, 2000);
  }

  private loadMigrationMeta() {
    const migrationsEntry = localStorage.getItem('picsa_migration_meta') || '{}';
    const meta: IMigrationMeta = {
      first_install_version: parseSemverVersion(APP_VERSION.number),
      history: {},
      ...JSON.parse(migrationsEntry),
    };
    return meta;
  }
}
function parseSemverVersion(v: string) {
  const [major, minor, patch] = v.split('.').map((n) => parseInt(n));
  return major * 1000000 + minor * 1000 + patch;
}
