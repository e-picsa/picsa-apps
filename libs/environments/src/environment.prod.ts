import type { IEnvironment } from '@picsa/models';

import { FirebaseConfig } from './firebase/config';
import GROUPS from './groups';

/** Used in main picsa extension app, allows country-change at runtime */
const productionEnvironment: IEnvironment = {
  firebase: FirebaseConfig,
  group: GROUPS.GLOBAL,
  production: true,
  defaultConfiguration: 'global',
  // TODO - load from CI
  supabase: {
    appUser: { email: 'anonymous_user@picsa.app' },
    load: async () => {
      return {
        anonKey:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcmZybXBvZHVibmJ1aGNsY2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODQ3NTM2ODIsImV4cCI6MjAwMDMyOTY4Mn0.bNZcTIB-LqzcubgEy0_azbw7chMtCp-w4Ss9plTeuKY',
        apiUrl: 'https://earfrmpodubnbuhclccx.supabase.co',
      };
    },
  },
};

export default productionEnvironment;
