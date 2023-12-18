import { commandSync } from 'execa';
import path from 'path';

const rootDir = path.resolve(__dirname, '../../../../');

async function teardown() {
  stopTestServer();
}

export function stopTestServer() {
  commandSync('yarn nx run picsa-server-docker-legacy:stop-test', {
    cwd: rootDir,
    shell: true,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
}

export default teardown;
