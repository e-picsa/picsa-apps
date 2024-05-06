import { Injector } from '@angular/core';

export default {
  up: async (injector: Injector) => {
    throw new Error('Test migration error');
  },
};
