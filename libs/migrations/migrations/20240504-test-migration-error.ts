import { Injector } from '@angular/core';
import { IMigration } from './types';

const migration: IMigration = {
  id: 20240504,
  label: 'Test Migration Error',
  up: async (injector: Injector) => {
    throw new Error('Test Error');
  },
};
export default migration;
