import { Injector } from '@angular/core';

export default {
  id: 20240505,
  label: 'Test Migration Success',
  up: async (injector: Injector) => {
    return 'Test success';
  },
};
