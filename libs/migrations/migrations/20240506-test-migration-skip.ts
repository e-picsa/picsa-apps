import { Injector } from '@angular/core';
import { IMigration } from '../types';

const migration: IMigration = {
  id: 20240506,
  label: 'Test Migration Skip',
  up: async (injector: Injector) => {
    throw new Error('This migration should have skiped');
  },
  app_version: '999.999.999',
};

export default migration;
