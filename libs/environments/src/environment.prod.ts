import type { IEnvironment } from '@picsa/models';

import { FirebaseConfig } from './firebase/config';
import GROUPS from './groups';

/** Used in main picsa app, allows country-change at runtime */
const productionEnvironment: IEnvironment = {
  firebase: FirebaseConfig,
  group: GROUPS.GLOBAL,
  production: true,
  supabase: {
    load: async () => {
      try {
        // Populated to assets by CI, or locally following `yarn nx run picsa-server:seed`
        const res = await fetch('/assets/supabaseConfig.json');
        return res.json();
      } catch (error) {
        console.error(`[Supabase] local config not found`);
        return { apiUrl: '', anonKey: '' };
      }
    },
  },
};

export default productionEnvironment;
