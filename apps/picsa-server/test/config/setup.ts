/**
 * Manually register paths to shared libs as ts-jest does not register
 * https://github.com/nrwl/nx/issues/2764
 * */
import { register as tsNodeRegister } from 'ts-node';
tsNodeRegister({ transpileOnly: true });
import { compilerOptions } from '../../../../tsconfig.base.json';
import { register as tsConfigRegister } from 'tsconfig-paths';
tsConfigRegister({
  baseUrl: './',
  paths: compilerOptions.paths,
});

import { commandSync } from 'execa';
import path from 'path';
import { populateEnv } from '@picsa/scripts';
import { isServerReady, waitForServerReady } from './common';
import { stopTestServer } from './teardown';

const rootDir = path.resolve(__dirname, '../../../../');
const envFilePath = path.resolve(__dirname, '../../.env.sample');

async function setup() {
  populateEnv(envFilePath);
  const serverReady = await isServerReady();
  if (serverReady) {
    const msg =
      'A server already appears to be running on port 1337, attempting close';
    console.log(msg);
    stopTestServer();
  }
  await startTestServer();
  console.log('\n\nwaiting for server setup...\n');
  await waitForServerReady();
  runDBMigrations();
}
async function startTestServer() {
  commandSync('yarn nx run picsa-server-docker:start-test', {
    cwd: rootDir,
    shell: true,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
}

function runDBMigrations() {
  commandSync('yarn nx run picsa-server-scripts:db-migrate', {
    cwd: rootDir,
    shell: true,
    stdio: 'inherit',
  });
}

export default setup;
