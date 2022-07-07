import dotenv from 'dotenv';
import { expand as dotenvExpand } from 'dotenv-expand';
import { PATHS } from '../paths';

/**
 * Populate env file in same way docker passes
 * For production this is just the `.env.` files
 * For test this is both the `sample.env` and `test.env` files
 * Uses dotenvExpand to allow variable interpolation
 */
export function populateEnv() {
  let { envFilePath } = PATHS;
  const isTest = process.argv.slice(2).includes('--env=test');
  if (isTest) {
    const sampleEnv = dotenv.config({
      path: envFilePath.replace('.env', '.env.sample'),
      override: true,
    });
    dotenvExpand(sampleEnv);
    const testEnv = dotenv.config({
      path: envFilePath.replace('.env', '.env.test'),
      override: true,
    });
    dotenvExpand(testEnv);
  } else {
    const prodEnv = dotenv.config({ path: envFilePath });
    dotenvExpand(prodEnv);
  }
}
