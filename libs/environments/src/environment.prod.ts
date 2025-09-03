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
        // Requires asset populated to project
        // { "glob": "*.json", "input": "libs/environments/src/assets", "output": "assets" }
        // avoid nx caching issues by updating `project.json` with `build.inputs`
        // "{projectRoot}/libs/environments/src/assets"
        const res = await fetch('/assets/supabaseConfig.json');
        if (!res.ok) {
          throw new Error(`Failed to fetch supabase config: ${res.status} ${res.statusText}`);
        }
        return res.json();
      } catch (error) {
        console.error(`[Supabase] local config not found`, error);
        throw new Error('[Supabase] Could not load configuration. Application cannot start.');
      }
    },
  },
};

export default productionEnvironment;
