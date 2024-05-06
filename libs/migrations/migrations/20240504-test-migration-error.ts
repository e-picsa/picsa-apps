import { Injector } from '@angular/core';

export default {
  id: 20240504,
  label: 'Test Migration Error',
  up: async (injector: Injector) => {
    throw new Error('Test Error');
  },
};
