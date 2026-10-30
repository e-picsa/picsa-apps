import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';

/** Remote object metadata used to validate cached files against Supabase storage */
export interface IStorageObjectMeta {
  size?: number | null;
  etag?: string | null;
  updatedAt?: string | null;
}

interface IStorageCacheEntry {
  size: number;
  etag?: string;
  updatedAt?: string;
}

interface IStorageCacheManifest {
  version: 1;
  files: Record<string, IStorageCacheEntry>;
}

const MANIFEST_FILE = 'manifest.json';
const FILES_DIR = 'files';

/**
 * Persistent on-disk cache of remote storage files referenced by seed rows.
 *
 * Extended seeding resets the local database before importing rows, which empties
 * `storage_objects` and previously forced every remote-referenced file to be
 * re-downloaded on every run. Bytes are stored once under
 * `<root>/files/<bucket>/<path>`, with a `manifest.json` recording the remote
 * `size`/`eTag`/`updatedAt` so unchanged files are uploaded from disk instead of
 * being fetched again.
 */
export class StorageFileCache {
  private manifest: IStorageCacheManifest = { version: 1, files: {} };
  private dirty = false;

  constructor(private readonly rootDir: string) {}

  /** Load the manifest from disk (no-op when absent, falls back to an empty cache when unreadable) */
  public load(): void {
    const manifestPath = this.manifestPath();
    if (!existsSync(manifestPath)) return;
    try {
      const parsed = JSON.parse(readFileSync(manifestPath, 'utf-8')) as IStorageCacheManifest;
      if (parsed?.version === 1 && parsed.files) {
        this.manifest = parsed;
      }
    } catch (err) {
      console.warn(`   ⚠️  Ignoring unreadable storage cache manifest: ${String(err)}`);
    }
  }

  /**
   * Whether the cached copy can be reused.
   * Remote metadata is authoritative when available; without it only the recorded
   * size is compared, matching the conservative fallback used by
   * `scripts/backup/backup-storage.ts`.
   */
  public isFresh(storagePath: string, remote?: IStorageObjectMeta): boolean {
    const entry = this.manifest.files[storagePath];
    if (!entry) return false;
    const localPath = this.localPath(storagePath);
    if (!existsSync(localPath) || statSync(localPath).size !== entry.size) return false;
    if (!remote) return true;
    if (remote.size != null && remote.size !== entry.size) return false;
    if (remote.etag && entry.etag && remote.etag !== entry.etag) return false;
    if (remote.updatedAt && entry.updatedAt && remote.updatedAt !== entry.updatedAt) return false;
    return true;
  }

  /** Read cached bytes, returning null when the file is missing */
  public read(storagePath: string): Buffer | null {
    const localPath = this.localPath(storagePath);
    if (!existsSync(localPath)) return null;
    return readFileSync(localPath);
  }

  /** Store freshly downloaded bytes and record the remote metadata used to validate them later */
  public write(storagePath: string, bytes: Buffer, remote?: IStorageObjectMeta): void {
    const localPath = this.localPath(storagePath);
    mkdirSync(dirname(localPath), { recursive: true });
    writeFileSync(localPath, bytes);
    this.manifest.files[storagePath] = {
      size: bytes.byteLength,
      ...(remote?.etag ? { etag: remote.etag } : {}),
      ...(remote?.updatedAt ? { updatedAt: remote.updatedAt } : {}),
    };
    this.dirty = true;
  }

  /** Drop cached files no longer referenced by the active seed configuration */
  public prune(keep: Set<string>): number {
    let removed = 0;
    for (const storagePath of Object.keys(this.manifest.files)) {
      if (keep.has(storagePath)) continue;
      rmSync(this.localPath(storagePath), { force: true });
      delete this.manifest.files[storagePath];
      removed++;
    }
    if (removed > 0) this.dirty = true;
    return removed;
  }

  /** Persist manifest changes to disk */
  public save(): void {
    if (!this.dirty) return;
    mkdirSync(this.rootDir, { recursive: true });
    writeFileSync(this.manifestPath(), JSON.stringify(this.manifest, null, 2), 'utf-8');
    this.dirty = false;
  }

  private manifestPath(): string {
    return resolve(this.rootDir, MANIFEST_FILE);
  }

  /** Guard against characters in DB-sourced paths escaping the cache directory */
  private localPath(storagePath: string): string {
    const filesRoot = resolve(this.rootDir, FILES_DIR);
    const localPath = resolve(filesRoot, storagePath);
    if (!localPath.startsWith(filesRoot + sep)) {
      throw new Error(`Refusing to resolve storage cache path outside cache directory: ${storagePath}`);
    }
    return localPath;
  }
}
