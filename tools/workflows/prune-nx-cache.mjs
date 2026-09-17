#!/usr/bin/env node

/**
 * Prunes the local Nx cache (.nx/cache) to prevent cache bloat in CI / GitHub Actions.
 *
 * Features:
 * 1. Age pruning: Removes cache entries older than maxAgeDays (default: 7 days).
 * 2. High/low watermark LRU pruning: If total cache exceeds maxSizeMb (default: 1500 MB),
 *    evicts oldest entries by access/modification time until total cache <= targetSizeMb (default: 800 MB).
 * 3. Ghost/temporary file cleanup: Cleans orphaned temp directories and broken lockfiles.
 *
 * Usage:
 *   node tools/workflows/prune-nx-cache.mjs [--max-size-mb=1500] [--target-size-mb=800] [--max-age-days=7] [--cache-dir=.nx/cache]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

// CLI Arguments parsing
const args = process.argv.slice(2);
function getArg(prefix, defaultValue) {
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.split('=')[1] : defaultValue;
}

const cacheDirRelative = getArg('--cache-dir=', '.nx/cache');
const cacheDir = path.resolve(rootDir, cacheDirRelative);
const maxSizeMb = Number.parseFloat(getArg('--max-size-mb=', '1500'));
const targetSizeMb = Number.parseFloat(getArg('--target-size-mb=', '800'));
const maxAgeDays = Number.parseFloat(getArg('--max-age-days=', '7'));

const maxSizeBytes = maxSizeMb * 1024 * 1024;
const targetSizeBytes = targetSizeMb * 1024 * 1024;
const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

function formatMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getPathSize(itemPath) {
  try {
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      let size = 0;
      const entries = fs.readdirSync(itemPath);
      for (const entry of entries) {
        size += getPathSize(path.join(itemPath, entry));
      }
      return size;
    }
    return stat.size;
  } catch {
    return 0;
  }
}

function safeRemove(itemPath) {
  try {
    if (fs.existsSync(itemPath)) {
      fs.rmSync(itemPath, { recursive: true, force: true });
      return true;
    }
  } catch (err) {
    console.warn(`[prune-nx-cache] Warning: could not remove ${itemPath}:`, err.message);
  }
  return false;
}

function runPrune() {
  if (!fs.existsSync(cacheDir)) {
    console.log(`[prune-nx-cache] Cache directory not found at ${cacheDir}. Nothing to prune.`);
    return;
  }

  const dirEntries = fs.readdirSync(cacheDir, { withFileTypes: true });
  if (dirEntries.length === 0) {
    console.log(`[prune-nx-cache] Cache directory ${cacheDir} is empty.`);
    return;
  }

  const now = Date.now();
  const entries = [];

  for (const dirEntry of dirEntries) {
    const fullPath = path.join(cacheDir, dirEntry.name);
    try {
      const stat = fs.statSync(fullPath);
      const size = dirEntry.isDirectory() ? getPathSize(fullPath) : stat.size;
      const mtimeMs = stat.mtimeMs || stat.ctimeMs || now;
      entries.push({
        name: dirEntry.name,
        fullPath,
        size,
        mtimeMs,
        ageDays: (now - mtimeMs) / (1000 * 60 * 60 * 24),
      });
    } catch {
      // Ignore if stat failed
    }
  }

  let totalSize = entries.reduce((acc, e) => acc + e.size, 0);
  console.log(`[prune-nx-cache] Starting cache prune on ${cacheDir}`);
  console.log(`[prune-nx-cache] Total entries: ${entries.length}, Total size: ${formatMb(totalSize)}`);
  console.log(
    `[prune-nx-cache] Thresholds: max=${formatMb(maxSizeBytes)}, target=${formatMb(targetSizeBytes)}, maxAge=${maxAgeDays} days`,
  );

  let removedCount = 0;
  let reclaimedBytes = 0;

  // Phase 1: Prune entries older than maxAgeDays or orphaned tmp files
  const activeEntries = [];
  for (const entry of entries) {
    const isTemp = entry.name.endsWith('.tmp') || entry.name.startsWith('.tmp');
    const isExpired = now - entry.mtimeMs > maxAgeMs;

    if (isExpired || (isTemp && now - entry.mtimeMs > 60 * 60 * 1000)) {
      if (safeRemove(entry.fullPath)) {
        removedCount++;
        reclaimedBytes += entry.size;
        totalSize -= entry.size;
      }
    } else {
      activeEntries.push(entry);
    }
  }

  if (removedCount > 0) {
    console.log(
      `[prune-nx-cache] Pruned ${removedCount} expired/stale entries. Reclaimed ${formatMb(reclaimedBytes)}.`,
    );
  }

  // Phase 2: If remaining totalSize > maxSizeBytes, perform LRU eviction until <= targetSizeBytes
  if (totalSize > maxSizeBytes) {
    console.log(
      `[prune-nx-cache] Cache size (${formatMb(totalSize)}) exceeds maximum allowed (${formatMb(maxSizeBytes)}). Triggering LRU eviction...`,
    );
    activeEntries.sort((a, b) => a.mtimeMs - b.mtimeMs);

    let lruRemoved = 0;
    for (const entry of activeEntries) {
      if (totalSize <= targetSizeBytes) break;
      if (safeRemove(entry.fullPath)) {
        lruRemoved++;
        totalSize -= entry.size;
      }
    }
    console.log(`[prune-nx-cache] Evicted ${lruRemoved} LRU entries.`);
  }

  console.log(`[prune-nx-cache] Prune completed. Final cache size: ${formatMb(Math.max(0, totalSize))}`);
}

runPrune();
