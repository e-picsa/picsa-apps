import { Injectable, Injector } from '@angular/core';
import { MIGRATIONS } from './migrations';
import { IMigrationStatus } from './types';
import { APP_VERSION, ENVIRONMENT } from '@picsa/environments/src';

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
    const pending = MIGRATIONS.filter(({ id, app_version }) => {
      if (first_install_version >= parseSemverVersion(app_version)) {
        return false;
      }
      const history = this.meta.history[id];
      if (history) {
        // re-run migrations with errors when developing locally
        if (history.error) {
          return ENVIRONMENT.production ? false : true;
        }
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
    const meta: IMigrationMeta = {
      first_install_version: parseSemverVersion(APP_VERSION.number),
      history: {},
    };
    // HACK - legacy users did not track first_install but may be available from resources storage
    const legacy_version = localStorage.getItem(`picsa-resources-tool||assets-cache-version`);
    if (legacy_version) {
      meta.first_install_version = parseSemverVersion(legacy_version);
    }
    // override with previously saved meta
    const migrationsEntry = localStorage.getItem('picsa_migration_meta') || '{}';
    return { ...meta, ...JSON.parse(migrationsEntry) };
  }
}
function parseSemverVersion(v: string) {
  const [major, minor, patch] = v.split('.').map((n) => parseInt(n));
  return major * 1000000 + minor * 1000 + patch;
}
