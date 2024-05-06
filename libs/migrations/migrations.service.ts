import { Injectable, Injector } from '@angular/core';
import { MIGRATIONS } from './migrations';

@Injectable({ providedIn: 'root' })
export class PicsaMigrationService {
  private migrationHistory: Record<string, { timestamp: string; result?: any; error?: string }> = {};

  public async runMigrations(injector: Injector): Promise<void> {
    this.migrationHistory = this.loadMigrationHistory();
    const pending = Object.entries(MIGRATIONS)
      .filter(([name]) => !Object.prototype.hasOwnProperty.call(this.migrationHistory, name))
      .sort((a, b) => (a[0] > b[0] ? 1 : -1));
    const timestamp = new Date().toLocaleString();
    if (pending.length > 0) {
      console.group('[Migrations]');
      for (const [name, migration] of pending) {
        console.log(`Exec ${name}`);
        try {
          console.log(`[Migration] ${name}`);
          const result = await migration.up(injector);
          this.migrationHistory[name] = { timestamp, result };
        } catch (error) {
          this.migrationHistory[name] = { timestamp, error: (error as any)?.message };
        }
      }
      console.log('Results', this.migrationHistory);
      console.groupEnd();
    }

    this.saveMigrationHistory();
  }

  private saveMigrationHistory() {
    // Use timeout to avoid blocking other init operations
    setTimeout(() => {
      localStorage.setItem('picsa_migrations', JSON.stringify(this.migrationHistory));
    }, 2000);
  }

  private loadMigrationHistory() {
    const migrationsEntry = localStorage.getItem('picsa_migrations') || '{}';
    return JSON.parse(migrationsEntry);
  }
}
