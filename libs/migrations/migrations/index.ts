import _20240504 from './20240504-test-migration-error';
import _20240505 from './20240505-test-migration-success';
import _20250217 from './20250217-rxdb-14-upgrade';
import _20251030 from './20251030-default-language';
import { IMigration } from '../types';

export const MIGRATIONS: IMigration[] = [_20240504, _20240505, _20250217, _20251030].sort((a, b) =>
  a.id > b.id ? 1 : -1,
);
