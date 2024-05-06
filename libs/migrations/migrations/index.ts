import { Injector } from '@angular/core';
import migration_20240504 from './20240504-test-migration-error';
import migration_20240505 from './20240505-test-migration-success';

interface IMigration {
  up: (injector: Injector) => Promise<any>;
}

export const MIGRATIONS: Record<string, IMigration> = {
  migration_20240504,
  migration_20240505,
};
