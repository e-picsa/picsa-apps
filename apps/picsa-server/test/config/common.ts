import path from 'path';
import http from 'http';
import dotenv from 'dotenv';
import { expand as dotenvExpand } from 'dotenv-expand';

/**
 * Populate env file in same way as the docker container will
 * Uses dotenvExpand to allow variable interpolation
 */
export function populateEnv() {
  let envFilePath = path.resolve(__dirname, '../../.env.sample');
  const sampleEnv = dotenv.config({ path: envFilePath, override: true });
  dotenvExpand(sampleEnv);
}

export async function waitForServerReady() {
  const isReady = await isServerReady();
  if (!isReady) {
    await sleep(2000);
    return waitForServerReady();
  }
}

export function isServerReady() {
  const options: http.RequestOptions = {
    hostname: 'localhost',
    port: 1337,
    path: '/parse',
    method: 'GET',
  };
  return new Promise((resolve) => {
    http
      .get(options)
      .on('response', () => {
        resolve(true);
      })
      .on('error', async () => {
        resolve(false);
      })
      .end();
  });
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
