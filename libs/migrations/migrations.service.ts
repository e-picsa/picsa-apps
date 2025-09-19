import { Injectable, Injector } from '@angular/core';
import { MIGRATIONS } from './migrations';
import { IMigrationStatus } from './types';
import { ENVIRONMENT } from '@picsa/environments';
import { APP_VERSION } from '@picsa/environments/src/version';

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
        if (history.result) {
          return false;
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
      localStorage.setItem('picsa_app_migration_history', JSON.stringify(this.meta.history));
    }, 2000);
  }

  private loadMigrationMeta(): IMigrationMeta {
    const firstInstallString = this.getFirstInstallVersion();
    const historyString = localStorage.getItem('picsa_app_migration_history');
    return {
      first_install_version: parseSemverVersion(firstInstallString),
      history: historyString ? JSON.parse(historyString) : {},
    };
  }

  /** Return the version of the app that the user first installed to */
  private getFirstInstallVersion() {
    let firstInstallVersion = localStorage.getItem('picsa_app_first_install_version');
    if (firstInstallVersion) {
      return firstInstallVersion;
    } else {
      // HACK - As first install only tracked from v3.52, fallback to v3.0.0 if the user is not
      // a first-time user but does not have accurate first install version
      const previousUser = localStorage.getItem('picsa_user_settings');
      firstInstallVersion = previousUser ? '3.0.0' : APP_VERSION;
      localStorage.setItem('picsa_app_first_install_version', firstInstallVersion);
      return firstInstallVersion;
    }
  }
}
function parseSemverVersion(v: string) {
  const [major, minor, patch] = v.split('.').map((n) => parseInt(n));
  return major * 1000000 + minor * 1000 + patch;
}
