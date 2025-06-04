import type { IEnvironment } from '@picsa/models';

import { FirebaseConfig } from './firebase/config';
import GROUPS from './groups';

/** Used in main picsa extension app, allows country-change at runtime */
const productionEnvironment: IEnvironment = {
  firebase: FirebaseConfig,
  group: GROUPS.GLOBAL,
  production: true,
  // TODO - load from CI
  supabase: {
    appUser: { email: 'admin@picsa.app' },
    load: async () => {
      return {
        anonKey:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwY3RhY3Fwenhmemx1Y2Jsb3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDUzNzI4MzksImV4cCI6MjAyMDk0ODgzOX0.AtbVpnOFjvvi5XIOesDtg6Gd5WCuZ2UENGNZWqHrlyE',
        apiUrl: 'https://wpctacqpzxfzlucblowh.supabase.co',
      };
    },
  },
};

export default productionEnvironment;
