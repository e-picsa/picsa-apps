import type { IEnvironment } from '@picsa/models';

import PRODUCTION_ENVIRONMENT from './environment.prod';
import { loadSupabaseConfig } from './supabase';

/**
 * Environments specify different build-time settings
 **/
const ENVIRONMENT: IEnvironment = {
  ...PRODUCTION_ENVIRONMENT,
  production: false,
  supabase: {
    load: async () => {
      const config = await loadSupabaseConfig();
      if (!config) {
        console.warn(`[Supabase] local config not found, using default`);
        return {
          apiUrl: 'http://localhost:54321',
          anonKey:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        };
      }
      return config;
    },
  },
};

export default ENVIRONMENT;
