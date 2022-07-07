import { command, commandSync } from 'execa';
import path from 'path';
import { waitForServerReady } from './common';

const rootDir = path.resolve(__dirname, '../../../../');

async function setup() {
  startTestServer();
  console.log('\n\nwaiting for server setup...\n');
  await waitForServerReady();
  runDBMigrations();
}
function startTestServer() {
  command('yarn nx run picsa-server-docker:start-test', {
    cwd: rootDir,
    shell: true,
    stdio: 'inherit',
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
