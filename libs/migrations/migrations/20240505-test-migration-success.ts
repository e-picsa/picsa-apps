import { Injector } from '@angular/core';
import { IMigration } from '../types';

const migration: IMigration = {
  id: 20240505,
  label: 'Test Migration Success',
  up: async (injector: Injector) => {
    return 'Test success';
  },
  app_version: '0.0.0',
};
export default migration;
