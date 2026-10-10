import assert from 'node:assert/strict';
import net from 'node:net';
import test from 'node:test';
import { findNextAvailablePort, isPortAvailable } from './dev-serve.mjs';

test('isPortAvailable correctly detects an unoccupied port', async () => {
  // Probe a high dynamic port that is almost certainly unused
  const testPort = 49152;
  const available = await isPortAvailable(testPort);
  assert.strictEqual(typeof available, 'boolean');
});

test('isPortAvailable detects an occupied port and findNextAvailablePort steps over it', async () => {
  // Find a free port first to use as our base
  const basePort = 39200;
  const freeBase = await findNextAvailablePort(basePort);

  // Bind a test server to the free base port
  const server = net.createServer();
  await new Promise((resolve) => {
    server.listen({ port: freeBase, host: '127.0.0.1' }, resolve);
  });

  try {
    // Port should now be detected as unavailable
    const available = await isPortAvailable(freeBase);
    assert.strictEqual(available, false, `Port ${freeBase} should be detected as occupied`);

    // findNextAvailablePort should step over it to freeBase + 1 or higher
    const nextPort = await findNextAvailablePort(freeBase);
    assert.ok(nextPort > freeBase, `Expected nextPort (${nextPort}) to be strictly greater than ${freeBase}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
