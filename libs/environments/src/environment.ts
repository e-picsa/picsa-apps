import type { IEnvironment } from '@picsa/models';

import PRODUCTION_ENVIRONMENT from './environment.prod';

/**
 * Environments specify different build-time settings
 **/
const ENVIRONMENT: IEnvironment = {
  ...PRODUCTION_ENVIRONMENT,
  production: false,
  supabase: {
    ...PRODUCTION_ENVIRONMENT.supabase,
    load: () => loadSupabaseDevEnvironment(),
  },
};

export default ENVIRONMENT;

/**
 * Asynchronously load supabase dev environment from local config file
 * This enables any developers to provide their own local anonKey by creating a
 * `config.json` file in the local `supabase` environment folder
 *
 * https://stackoverflow.com/a/47956054/5693245
 * */
async function loadSupabaseDevEnvironment(): Promise<{ anonKey: string; apiUrl: string }> {
  const defaultConfig = {
    anonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    // Assumes proxy configured as per `{workspaceRoot}/proxy.conf.js`
    apiUrl: 'http://localhost:4200/api',
    // apiUrl: 'http://localhost:54321',
  };
  return new Promise((resolve) => {
    // Use a variable filename so that compiler bundles all files in folder
    // regardless of whether specific config file exists or not
    const filename = 'config.json';
    // use try-catch (web) and promise catch (node)
    try {
      import(`./supabase/${filename}`)
        .then((res) => {
          resolve({ ...defaultConfig, ...res.default });
        })
        .catch(() => {
          console.warn('[Supabase] Dev config not provided\nlibs/environments/src/supabase/config.json');
          resolve(defaultConfig);
        });
    } catch (error) {
      console.warn('[Supabase] Dev config not provided\nlibs/environments/src/supabase/config.json');
      resolve(defaultConfig);
    }
  });
}
