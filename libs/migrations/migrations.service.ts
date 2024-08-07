import { Injectable, Injector } from '@angular/core';
import { MIGRATIONS } from './migrations';

@Injectable({ providedIn: 'root' })
export class PicsaMigrationService {
  private migrationHistory: Record<string, { timestamp: string; result?: any; error?: string }> = {};

  public async runMigrations(injector: Injector): Promise<void> {
    this.migrationHistory = this.loadMigrationHistory();
    const pending = MIGRATIONS.filter(({ id }) => !Object.prototype.hasOwnProperty.call(this.migrationHistory, id));
    const timestamp = new Date().toLocaleString();
    if (pending.length > 0) {
      console.group('[Migrations]');
      for (const { id, label, up } of pending) {
        console.log(`Exec ${id} - ${label}`);
        try {
          const result = await up(injector);
          this.migrationHistory[id] = { timestamp, result };
        } catch (error) {
          this.migrationHistory[id] = { timestamp, error: (error as any)?.message };
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
