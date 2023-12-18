import dotenv from 'dotenv';
import { expand as dotenvExpand } from 'dotenv-expand';

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Populate env file in same way as the docker container will
 * Uses dotenvExpand to allow variable interpolation
 */
export function populateEnv(path: string) {
  const sampleEnv = dotenv.config({ path, override: true });
  dotenvExpand(sampleEnv);
}
