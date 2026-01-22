import { Injector } from '@angular/core';
import { RXDB_14_Migrate } from './rxdb-14.migration';
import { IMigration } from '../../types';

const migration: IMigration = {
  id: 20250217,
  label: 'RXDB 14 Migration',
  up: async (injector: Injector) => RXDB_14_Migrate(injector),
  app_version: '3.52.0',
};
export default migration;
