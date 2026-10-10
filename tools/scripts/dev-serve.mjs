#!/usr/bin/env node

/**
 * ============================================================================
 * PICSA Parallel Development Dev-Server Runner (`dev-serve.mjs`)
 * ============================================================================
 *
 * WHY THIS SCRIPT EXISTS (Why not just use raw `nx serve` / `ng serve`?):
 * ----------------------------------------------------------------------------
 * 1. Port Collisions in Parallel Development:
 *    When working on multiple features simultaneously across git worktrees or
 *    separate terminal tabs, raw `ng serve` / `nx serve` fails immediately with
 *    `listen EADDRINUSE: address already in use` whenever port 4200 (or 3000)
 *    is occupied. Angular CLI does not auto-increment ports when run via Nx or
 *    non-interactive scripts.
 *
 * 2. Uncoordinated App & Dashboard Defaults:
 *    Both the main frontend app (`picsa-apps-app`) and dashboard historically
 *    defaulted to port 4200, preventing developers from running both locally at
 *    the same time without manually passing custom `--port` flags.
 *
 * 3. Lost Port Links in Rapidly Scrolling Logs:
 *    Angular and Vite compilation logs scroll quickly during initial bundling
 *    and hot reloads, burying the URL and port link in terminal scrollback.
 *
 * WHAT THIS SCRIPT PROVIDES:
 * ----------------------------------------------------------------------------
 * - Dual-Stack Port Probing: Cross-platform check (Windows, macOS, Linux) across
 *   IPv4 (`127.0.0.1`, `0.0.0.0`) and IPv6 (`::1`). Automatically allocates
 *   the next sequential open port (e.g. 4200 -> 4201 -> 4202...).
 * - CLI Override Support: If the developer explicitly passes `--port <N>`, the
 *   script honors it directly without auto-probing.
 * - Dynamic Terminal Tab Title: Sets the terminal tab/window title to include
 *   the app, git branch/worktree, and port (e.g. `picsa-app [feature-x :4201]`),
 *   which remains visible even after logs scroll or terminals are switched.
 * - Clickable Startup Banner: Prints an eye-catching terminal card with an
 *   OSC 8 clickable hyperlink directly to the server.
 * - Ephemeral State File (`.serve-info.json`): Saves active port and metadata
 *   in the worktree root for external scripts and AI agents, automatically
 *   cleaned up on server exit.
 * - Helper Utilities: Supports `yarn open` / `--open` to immediately launch or
 *   inspect the active running server in the default browser.
 * - Zero Dependencies: Built entirely on Node.js standard modules (`net`,
 *   `child_process`, `fs`, `path`).
 *
 * USAGE:
 * ----------------------------------------------------------------------------
 *   node tools/scripts/dev-serve.mjs [project] [options]
 *
 * Examples:
 *   node tools/scripts/dev-serve.mjs picsa-apps-app --default-port=4200
 *   node tools/scripts/dev-serve.mjs picsa-apps-dashboard --default-port=3000
 *   node tools/scripts/dev-serve.mjs --open   # Open active server in browser
 * ============================================================================
 */

import { execSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const STATE_FILE_PATH = path.join(REPO_ROOT, '.serve-info.json');
const IS_WINDOWS = process.platform === 'win32';

/** Print CLI help and exit */
function printHelp() {
  console.log(`
PICSA Parallel Dev Server Runner

Usage:
  node tools/scripts/dev-serve.mjs [project] [options]

Arguments:
  project               Nx project name (default: picsa-apps-app)

Options:
  --default-port <N>    Base port to check first (default: 4200)
  --port <N>            Explicit port override (bypasses auto-detection)
  --open                Open active running server in browser (or launch with --open)
  --status              Print current active server info from .serve-info.json
  -h, --help            Show this help message

All other flags (e.g. --configuration, --host, --ssl) are passed through to \`nx serve\`.
`);
}

/** Check if a TCP port can be bound exclusively on a specific network interface */
function probeInterface(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    try {
      server.listen({ port, host, exclusive: true });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Check if a port is available across dual-stack interfaces.
 * Testing both 127.0.0.1 and 0.0.0.0 prevents false positives under Windows Winsock,
 * and probing ::1 ensures compatibility with Node's modern IPv6 localhost resolution.
 */
export async function isPortAvailable(port) {
  // Check IPv4 loopback
  const ipv4 = await probeInterface(port, '127.0.0.1');
  if (!ipv4) return false;

  // Check 0.0.0.0 (all IPv4 interfaces)
  const allIpv4 = await probeInterface(port, '0.0.0.0');
  if (!allIpv4) return false;

  // Check IPv6 loopback (guarded in case host OS has IPv6 disabled)
  try {
    const ipv6 = await probeInterface(port, '::1');
    if (!ipv6) return false;
  } catch {
    // IPv6 unsupported on this environment, ignore
  }

  return true;
}

/**
 * Finds the first available port starting from `basePort`, testing sequentially
 * (e.g. 4200, 4201, 4202...) up to `maxAttempts`.
 */
export async function findNextAvailablePort(basePort, maxAttempts = 30) {
  for (let offset = 0; offset < maxAttempts; offset++) {
    const candidate = basePort + offset;
    if (await isPortAvailable(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Could not find an available port in range ${basePort}..${basePort + maxAttempts - 1}.`);
}

/** Retrieve current git branch name and worktree directory name */
function getGitContext() {
  let branch = '';
  try {
    branch = execSync('git branch --show-current', {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!branch) {
      // In detached HEAD or bare worktree, retrieve short commit hash
      const commit = execSync('git rev-parse --short HEAD', {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      branch = commit ? `detached@${commit}` : 'unknown';
    }
  } catch {
    branch = 'unknown';
  }

  const worktree = path.basename(REPO_ROOT);
  return { branch, worktree };
}

/** Set the terminal tab/window title using standard OSC 0 sequence */
function setTerminalTitle(title) {
  if (process.stdout.isTTY) {
    process.stdout.write(`\x1b]0;${title}\x07`);
  }
}

/** Creates a terminal-clickable hyperlink using OSC 8 */
function formatClickableLink(url) {
  return `\x1b]8;;${url}\x1b\\${url}\x1b]8;;\x1b\\`;
}

/** Open a URL in the user's default system browser across platforms */
function openInBrowser(url) {
  const openCmd = IS_WINDOWS
    ? `start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  try {
    execSync(openCmd, { stdio: 'ignore' });
  } catch {
    console.warn(`Could not automatically open browser. Please navigate to: ${url}`);
  }
}

/** Synchronously write ephemeral state file */
function writeStateFile(data) {
  try {
    writeFileSync(STATE_FILE_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  } catch (err) {
    console.warn('Warning: Could not write .serve-info.json:', err.message);
  }
}

/** Synchronously clean up ephemeral state file */
export function cleanupStateFile() {
  try {
    if (existsSync(STATE_FILE_PATH)) {
      unlinkSync(STATE_FILE_PATH);
    }
  } catch {
    // Ignore cleanup errors on process termination
  }
}

/** Standalone action: Read status from .serve-info.json and print/open */
function handleStatusOrOpenAction({ openBrowser }) {
  if (!existsSync(STATE_FILE_PATH)) {
    console.log('\nNo active dev server detected (.serve-info.json not found).');
    console.log('Start the server using `yarn start` or `yarn start:dashboard`.\n');
    return 1;
  }

  try {
    const info = JSON.parse(readFileSync(STATE_FILE_PATH, 'utf8'));
    console.log(`\nActive Dev Server:`);
    console.log(`  Project:  ${info.project}`);
    console.log(`  URL:      ${formatClickableLink(info.url)}`);
    console.log(`  Branch:   ${info.branch} (${info.worktree})`);
    console.log(`  PID:      ${info.pid}`);
    console.log(`  Started:  ${info.startedAt}\n`);

    if (openBrowser) {
      openInBrowser(info.url);
    }
    return 0;
  } catch (err) {
    console.error('Failed to read .serve-info.json:', err.message);
    return 1;
  }
}

/** Parse arguments and execute */
export async function main() {
  const rawArgs = process.argv.slice(2);

  if (rawArgs.includes('-h') || rawArgs.includes('--help')) {
    printHelp();
    return 0;
  }

  // Handle standalone `yarn open` or `--status`
  const isStatusOnly = rawArgs.includes('--status');
  const isOpenStandalone = rawArgs.length === 1 && rawArgs[0] === '--open';
  if (isStatusOnly || isOpenStandalone) {
    return handleStatusOrOpenAction({ openBrowser: isOpenStandalone });
  }

  // Extract project name, base port, and passthrough flags
  let project = 'picsa-apps-app';
  let defaultPort = 4200;
  let explicitPort = null;
  const passthroughArgs = [];

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];

    if (arg.startsWith('--default-port=')) {
      defaultPort = Number.parseInt(arg.split('=')[1], 10);
    } else if (arg === '--default-port' && i + 1 < rawArgs.length) {
      defaultPort = Number.parseInt(rawArgs[++i], 10);
    } else if (arg.startsWith('--port=')) {
      explicitPort = Number.parseInt(arg.split('=')[1], 10);
      passthroughArgs.push(arg);
    } else if (arg === '--port' && i + 1 < rawArgs.length) {
      explicitPort = Number.parseInt(rawArgs[++i], 10);
      passthroughArgs.push(`--port=${explicitPort}`);
    } else if (!arg.startsWith('-') && i === 0) {
      project = arg;
    } else {
      passthroughArgs.push(arg);
    }
  }

  // Resolve target port
  let allocatedPort;
  let portWasOccupied = false;

  if (explicitPort !== null && !Number.isNaN(explicitPort)) {
    allocatedPort = explicitPort;
  } else {
    allocatedPort = await findNextAvailablePort(defaultPort);
    if (allocatedPort !== defaultPort) {
      portWasOccupied = true;
    }
    passthroughArgs.push(`--port=${allocatedPort}`);
  }

  const { branch, worktree } = getGitContext();
  const cleanBranch = branch.replace(/^t3code\//, '');
  const url = `http://localhost:${allocatedPort}`;

  // 1. Dynamic terminal window/tab title
  const appShortName = project.includes('dashboard') ? 'picsa-dashboard' : 'picsa-app';
  setTerminalTitle(`${appShortName} [${cleanBranch} :${allocatedPort}]`);

  // 2. Clickable Banner
  console.log('\n┌────────────────────────────────────────────────────────────────────────┐');
  console.log(`│  PICSA Dev Server: \x1b[1m${project}\x1b[0m`);
  console.log(`│  Branch / Worktree: \x1b[36m${branch}\x1b[0m (\x1b[33m${worktree}\x1b[0m)`);
  console.log(`│  Local URL:        \x1b[32m\x1b[1m${formatClickableLink(url)}\x1b[0m`);
  if (portWasOccupied) {
    console.log(
      `│  Port Status:      \x1b[33mDefault port ${defaultPort} was busy -> selected ${allocatedPort}\x1b[0m`,
    );
  }
  console.log('└────────────────────────────────────────────────────────────────────────┘\n');

  // 3. Write ephemeral state file
  writeStateFile({
    project,
    port: allocatedPort,
    url,
    branch,
    worktree,
    pid: process.pid,
    startedAt: new Date().toISOString(),
  });

  // Register cleanups for graceful shutdown
  const cleanup = () => cleanupStateFile();
  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });
  if (!IS_WINDOWS) {
    process.on('SIGHUP', () => {
      cleanup();
      process.exit(0);
    });
  }

  // 4. Cross-platform execution: spawn `yarn nx serve <project> --port=<allocatedPort> ...args`
  const yarnCmd = IS_WINDOWS ? 'yarn.cmd' : 'yarn';
  const spawnArgs = ['nx', 'serve', project, ...passthroughArgs];

  const child = spawn(yarnCmd, spawnArgs, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    shell: IS_WINDOWS,
  });

  child.on('exit', (code, signal) => {
    cleanup();
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  child.on('error', (err) => {
    cleanup();
    console.error(`Failed to launch nx serve: ${err.message}`);
    process.exit(1);
  });

  return 0;
}

// Only invoke main when script is executed directly from CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    cleanupStateFile();
    console.error(`Dev server runner error: ${err.message}`);
    process.exit(1);
  });
}
