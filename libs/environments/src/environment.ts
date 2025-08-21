import type { IEnvironment } from '@picsa/models';

import PRODUCTION_ENVIRONMENT from './environment.prod';

const supabaseDefaultConfig = {
  apiUrl: 'http://localhost:54321',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
};

/**
 * Environments specify different build-time settings
 **/
const ENVIRONMENT: IEnvironment = {
  ...PRODUCTION_ENVIRONMENT,
  production: false,
  supabase: {
    load: async () => {
      try {
        // Populated to assets by CI, or locally following `yarn nx run picsa-server:seed`
        // Requires asset populated to project
        // { "glob": "*.json", "input": "libs/environments/src/assets", "output": "assets" }
        const res = await fetch('/assets/supabaseConfig.json');
        if (res.ok) {
          return res.json();
        }
        return supabaseDefaultConfig;
      } catch (error) {
        console.warn(`[Supabase] local config not found, using default`);
        return supabaseDefaultConfig;
      }
    },
  },
};

export default ENVIRONMENT;
