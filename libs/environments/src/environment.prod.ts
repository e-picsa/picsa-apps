import type { IEnvironment } from '@picsa/models';

import { FirebaseConfig } from './firebase/config';
import GROUPS from './groups';
import { loadSupabaseConfig } from './supabase';

/** Used in main picsa app, allows country-change at runtime */
const productionEnvironment: IEnvironment = {
  firebase: FirebaseConfig,
  group: GROUPS.GLOBAL,
  production: true,
  supabase: {
    load: async () => {
      const config = await loadSupabaseConfig();
      if (!config) {
        console.error(`[Supabase] production config not found`);
        return { anonKey: '', apiUrl: '' };
      }
      return config;
    },
  },
};

export default productionEnvironment;
