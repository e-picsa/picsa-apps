import { Injector } from '@angular/core';
import { DB_MIGRATIONS } from '@picsa/shared/services/core/db_v2/migration';
import { IMigration } from './types';

const migration: IMigration = {
  id: 20250217,
  label: 'RXDB 14 Migration',
  up: async (injector: Injector) => {
    const res = await DB_MIGRATIONS[14](injector);
    console.log('migration res', res);
    throw new Error('rxdb 14 fail');
  },
  retryOnFail: true,
};
export default migration;
