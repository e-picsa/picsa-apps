import type { IEnvironment } from '@picsa/models';

import { FirebaseConfig } from './firebase/config';
import GROUPS from './groups';

/** Used in main picsa app, allows country-change at runtime */
const productionEnvironment: IEnvironment = {
  firebase: FirebaseConfig,
  group: GROUPS.GLOBAL,
  production: true,
  supabase: {
    load: async () => await loadSupabaseConfig(),
  },
};

export default productionEnvironment;

/**
 * Asynchronously load supabase dev environment from local config file
 * This enables any developers to provide their own local anonKey by creating a
 * `config.json` file in the local `supabase` environment folder
 *
 * https://stackoverflow.com/a/47956054/5693245
 *
 * It will be automatically populated when running locally with db seed
 *
 * ```sh
 * yarn nx run picsa-server:seed
 * ```
 * */
async function loadSupabaseConfig(): Promise<{ anonKey: string; apiUrl: string }> {
  const defaultConfig = {
    apiUrl: 'http://localhost:54321',
    anonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
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
          resolve(defaultConfig);
        });
    } catch (error) {
      resolve(defaultConfig);
    }
  });
}
