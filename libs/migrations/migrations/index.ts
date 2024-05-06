import { Injector } from '@angular/core';
import migration_20240504 from './20240504-test-migration-error';
import migration_20240505 from './20240505-test-migration-success';

interface IMigration {
  /** Migrations will be carried out in */
  id: number;
  /** Label used for logging purposes */
  label: string;
  /** Migration logic. Included injector to access additional services */
  up: (injector: Injector) => Promise<any>;
}

export const MIGRATIONS: IMigration[] = [migration_20240504, migration_20240505].sort((a, b) => (a.id > b.id ? 1 : -1));
