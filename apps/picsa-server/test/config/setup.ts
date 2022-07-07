import { command } from 'execa';
import path from 'path';
import { waitForServerReady } from './common';

const rootDir = path.resolve(__dirname, '../../../../');

async function setup() {
  startTestServer();
  console.log('\n\nwaiting for server setup...\n');
  await waitForServerReady();
}
function startTestServer() {
  command('yarn nx run picsa-server-docker:start-test', {
    cwd: rootDir,
    shell: true,
    stdio: 'inherit',
  });
}

export default setup;
