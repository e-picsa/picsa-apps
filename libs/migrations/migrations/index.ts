import migration_20240504 from './20240504-test-migration-error';
import migration_20240505 from './20240505-test-migration-success';
import migration_20250217 from './20250217-rxdb-14-upgrade';
import { IMigration } from './types';

export const MIGRATIONS: IMigration[] = [migration_20240504, migration_20240505, migration_20250217].sort((a, b) =>
  a.id > b.id ? 1 : -1
);
