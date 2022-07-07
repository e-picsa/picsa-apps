import { command } from 'execa';
import path from 'path';
import { waitForServerStopped } from './common';

const rootDir = path.resolve(__dirname, '../../../../');

async function teardown() {
  stopTestServer();
  console.log('\n\nwaiting for server teardown...\n');
  await waitForServerStopped();
}
function stopTestServer() {
  command('yarn nx run picsa-server-docker:stop-test', {
    cwd: rootDir,
    shell: true,
    stdio: 'inherit',
  });
}

export default teardown;
