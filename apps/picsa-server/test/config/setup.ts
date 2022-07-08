import { commandSync } from 'execa';
import path from 'path';
import { isServerReady, populateEnv, waitForServerReady } from './common';
import { stopTestServer } from './teardown';

const rootDir = path.resolve(__dirname, '../../../../');

async function setup() {
  populateEnv();
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
  commandSync('yarn nx run picsa-server-scripts:db-migrate-test', {
    cwd: rootDir,
    shell: true,
    stdio: 'inherit',
  });
}

export default setup;
