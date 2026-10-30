import assert from 'node:assert/strict';
import net from 'node:net';
import test from 'node:test';
import {
  cleanupStateFile,
  findNextAvailablePort,
  getGitContext,
  isPortAvailable,
  readStateFile,
  writeStateFile,
} from './dev-serve.mjs';

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

test('getGitContext extracts current git branch and worktree directly from fs', () => {
  const { branch, worktree } = getGitContext();
  assert.ok(typeof branch === 'string' && branch.length > 0, 'branch should be a non-empty string');
  assert.ok(typeof worktree === 'string' && worktree.length > 0, 'worktree should be a non-empty string');
});

test('state file supports multiple concurrent servers without collisions', () => {
  try {
    writeStateFile('picsa-apps-app', {
      project: 'picsa-apps-app',
      port: 4200,
      url: 'http://localhost:4200',
      branch: 'test-branch',
      worktree: 'test-worktree',
      pid: 1234,
      startedAt: new Date().toISOString(),
    });

    writeStateFile('picsa-apps-dashboard', {
      project: 'picsa-apps-dashboard',
      port: 3000,
      url: 'http://localhost:3000',
      branch: 'test-branch',
      worktree: 'test-worktree',
      pid: 5678,
      startedAt: new Date().toISOString(),
    });

    const state = readStateFile();
    assert.strictEqual(state['picsa-apps-app']?.port, 4200);
    assert.strictEqual(state['picsa-apps-dashboard']?.port, 3000);

    // Prune one server
    cleanupStateFile('picsa-apps-app');
    const stateAfterPrune = readStateFile();
    assert.strictEqual(stateAfterPrune['picsa-apps-app'], undefined);
    assert.strictEqual(stateAfterPrune['picsa-apps-dashboard']?.port, 3000);
  } finally {
    cleanupStateFile();
  }
});
