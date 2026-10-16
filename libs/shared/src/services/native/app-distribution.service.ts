import { Clipboard } from '@angular/cdk/clipboard';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import write_blob from 'capacitor-blob-writer';
import { firstValueFrom, Subscription } from 'rxjs';

import { FileService } from '../core/file.service';
import { PicsaNotificationService } from '../core/notification.service';
import { SupabaseService } from '../core/supabase/supabase.service';

export const APK_RELEASES_BUCKET = 'apk-releases';
export const APK_LATEST_FILE = 'e-picsa-universal-latest.apk';
export const APK_LATEST_META_FILE = 'latest.json';
export const APK_MIME_TYPE = 'application/vnd.android.package-archive';
export const APK_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=io.picsa.extension';
const APK_CACHE_FOLDER = 'picsa_apk';
const APK_META_CACHE_KEY = 'picsa-apk-releases||cached-meta';

export interface IApkReleaseMeta {
  versionCode: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export type ApkDownloadStatus = 'idle' | 'checking' | 'downloading' | 'complete' | 'error';

export interface ICachedApk {
  fileName: string;
  fileSize: number;
  path: string;
  versionCode: number | null;
}

/**
 * Client service for peer-to-peer app distribution via a Google-signed universal APK
 * synced from Play Store into Supabase Storage (`apk-releases` bucket).
 *
 * - Canonical download: `e-picsa-universal-latest.apk` (+ `latest.json` metadata)
 * - Caches APK on device filesystem for offline sharing via native share sheet
 */
@Injectable({ providedIn: 'root' })
export class AppDistributionService {
  private supabaseService = inject(SupabaseService);
  private fileService = inject(FileService);
  private notificationService = inject(PicsaNotificationService);
  private clipboard = inject(Clipboard);
  private http = inject(HttpClient);

  public latestMeta = signal<IApkReleaseMeta | null>(null);
  public status = signal<ApkDownloadStatus>('idle');
  public progress = signal(0);
  public error = signal<string | null>(null);
  public cached = signal<ICachedApk | null>(null);

  public isNative = computed(() => Capacitor.isNativePlatform());
  public isDownloaded = computed(() => this.cached() !== null);
  public isDownloading = computed(() => this.status() === 'downloading');
  public downloadUrl = computed(() => this.getPublicUrl(APK_LATEST_FILE));

  private downloadSubscription?: Subscription;

  /** Fetch `latest.json` metadata and refresh cached-file status */
  public async checkLatest(): Promise<IApkReleaseMeta | null> {
    if (this.status() === 'downloading') return this.latestMeta();
    this.status.set('checking');
    this.error.set(null);
    try {
      const metaUrl = this.getPublicUrl(APK_LATEST_META_FILE);
      const meta = await firstValueFrom(this.http.get<IApkReleaseMeta>(metaUrl));
      if (!meta || typeof meta.versionCode !== 'number' || !meta.fileName) {
        throw new Error('Invalid release metadata');
      }
      this.latestMeta.set(meta);
      this.status.set('idle');
      await this.refreshCachedStatus();
      return meta;
    } catch (err) {
      console.error('[AppDistribution] checkLatest failed', err);
      this.error.set('Could not check for the latest app version.');
      this.status.set('error');
      // Still report locally cached state so offline sharing keeps working
      await this.refreshCachedStatus().catch(() => undefined);
      return null;
    }
  }

  /** Download canonical universal APK with progress, then cache on device filesystem */
  public async downloadApk(): Promise<void> {
    if (this.status() === 'downloading') return;
    this.error.set(null);
    this.progress.set(0);
    this.status.set('downloading');
    try {
      const meta = this.latestMeta() ?? (await this.checkLatestSilent());
      const fileName = meta?.fileName ?? APK_LATEST_FILE;
      const url = this.getPublicUrl(APK_LATEST_FILE);
      const blob = await this.downloadWithProgress(url);
      const path = await this.writeCacheFile(fileName, blob);
      const stat = await Filesystem.stat({ path, directory: Directory.Data });
      const cached: ICachedApk = {
        fileName,
        fileSize: stat.size,
        path,
        versionCode: meta?.versionCode ?? this.parseVersionCode(fileName),
      };
      this.cached.set(cached);
      this.persistCachedMeta(cached);
      this.progress.set(100);
      this.status.set('complete');
      this.notificationService.showSuccessNotification('App package downloaded and ready to share offline');
    } catch (err) {
      console.error('[AppDistribution] download failed', err);
      this.error.set('Download failed. Please check your connection and try again.');
      this.status.set('error');
      throw err;
    }
  }

  public cancelDownload() {
    this.downloadSubscription?.unsubscribe();
    this.downloadSubscription = undefined;
    if (this.status() === 'downloading') {
      this.status.set('idle');
      this.progress.set(0);
    }
  }

  /** Check whether APK already cached on device, report version/size */
  public async refreshCachedStatus(): Promise<ICachedApk | null> {
    const stored = this.readPersistedMeta();
    const candidates = [stored?.fileName, this.latestMeta()?.fileName, APK_LATEST_FILE].filter((v): v is string => !!v);
    for (const fileName of new Set(candidates)) {
      const path = `${APK_CACHE_FOLDER}/${fileName}`;
      try {
        const stat = await Filesystem.stat({ path, directory: Directory.Data });
        const cached: ICachedApk = {
          fileName,
          fileSize: stat.size,
          path,
          versionCode: stored?.versionCode ?? this.parseVersionCode(fileName),
        };
        this.cached.set(cached);
        return cached;
      } catch {
        continue;
      }
    }
    this.cached.set(null);
    return null;
  }

  /** Delete cached APK to reclaim disk space */
  public async clearCachedApk(): Promise<void> {
    const cached = this.cached();
    if (!cached) return;
    try {
      await Filesystem.deleteFile({ path: cached.path, directory: Directory.Data });
    } catch (err: unknown) {
      // Tolerate already-removed files; surface anything else
      const code = (err as { code?: string })?.code;
      if (code !== 'OS-PLUG-FILE-0008') {
        console.error('[AppDistribution] delete failed', err);
        throw err;
      }
    }
    this.cached.set(null);
    this.progress.set(0);
    if (this.status() === 'complete') this.status.set('idle');
    try {
      localStorage.removeItem(APK_META_CACHE_KEY);
    } catch {
      return;
    }
  }

  /** Share the public download link (Play Store + direct APK url) */
  public async shareDownloadLink(): Promise<void> {
    const url = this.getPublicUrl(APK_LATEST_FILE);
    const text = `Get the E-PICSA app: ${APK_PLAY_STORE_URL} (offline installer: ${url})`;
    try {
      const { value: canShare } = await Share.canShare().catch(() => ({ value: false }));
      if (canShare) {
        await Share.share({ title: 'Share E-PICSA App', text, url: APK_PLAY_STORE_URL, dialogTitle: 'Share App' });
        return;
      }
      throw new Error('Share not supported');
    } catch {
      this.clipboard.copy(APK_PLAY_STORE_URL);
      this.notificationService.showUserNotification({ matIcon: 'content_copy', message: 'Play Store link copied' });
    }
  }

  /**
   * Dispatch cached APK to native share sheet (Bluetooth, Quick Share, WhatsApp...)
   * Uses FileProvider-safe cache dir with strict APK mime handling
   */
  public async shareCachedApk(): Promise<void> {
    const cached = this.cached() ?? (await this.refreshCachedStatus());
    if (!cached) throw new Error('No downloaded app package found');
    const cacheUri = await this.copyToShareCache(cached);
    const title = cached.fileName;
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title, text: 'E-PICSA app installer', files: [cacheUri], dialogTitle: 'Share App' });
    } else {
      if (navigator.canShare) {
        const blob = await this.readCacheBlob(cached);
        const file = new File([blob], cached.fileName, { type: APK_MIME_TYPE });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title, text: 'E-PICSA app installer', files: [file] });
          return;
        }
      }
      throw new Error('File sharing not supported');
    }
  }

  public getPlayStoreUrl() {
    return APK_PLAY_STORE_URL;
  }

  private getPublicUrl(objectPath: string): string {
    try {
      return this.supabaseService.storage.getPublicLink(APK_RELEASES_BUCKET, objectPath);
    } catch {
      const apiUrl = this.supabaseService.config?.apiUrl;
      if (apiUrl) return `${apiUrl}/storage/v1/object/public/${APK_RELEASES_BUCKET}/${objectPath}`;
      throw new Error('Storage client not initialised');
    }
  }

  private async checkLatestSilent(): Promise<IApkReleaseMeta | null> {
    try {
      const metaUrl = this.getPublicUrl(APK_LATEST_META_FILE);
      const meta = await firstValueFrom(this.http.get<IApkReleaseMeta>(metaUrl));
      if (meta && typeof meta.versionCode === 'number') {
        this.latestMeta.set(meta);
        return meta;
      }
    } catch {
      return this.latestMeta();
    }
    return this.latestMeta();
  }

  private downloadWithProgress(url: string): Promise<Blob> {
    const { subscription, updates$ } = this.fileService.downloadFile(url, 'blob');
    this.downloadSubscription = subscription;
    return new Promise<Blob>((resolve, reject) => {
      let data: Blob | null = null;
      updates$.subscribe({
        next: ({ progress, data: chunk }) => {
          this.progress.set(progress);
          if (chunk instanceof Blob) data = chunk;
        },
        error: (err) => {
          this.downloadSubscription = undefined;
          reject(err);
        },
        complete: () => {
          this.downloadSubscription = undefined;
          if (data) resolve(data);
          else reject(new Error('No download data on completion'));
        },
      });
    });
  }

  private async writeCacheFile(fileName: string, blob: Blob): Promise<string> {
    const path = `${APK_CACHE_FOLDER}/${fileName}`;
    await write_blob({ path, directory: Directory.Data, blob, recursive: true, fast_mode: true });
    return path;
  }

  private async copyToShareCache(cached: ICachedApk): Promise<string> {
    // HACK - native share sheet only serves files from cache dir (FileProvider);
    // copy from data dir, keep .apk extension so mime resolves to application/vnd.android.package-archive
    const { uri: cacheFileUri } = await Filesystem.copy({
      from: cached.path,
      directory: Directory.Data,
      to: cached.fileName,
      toDirectory: Directory.Cache,
    });
    return cacheFileUri;
  }

  private async readCacheBlob(cached: ICachedApk): Promise<Blob> {
    const { data } = await Filesystem.readFile({ path: cached.path, directory: Directory.Data });
    const base64 = typeof data === 'string' ? data : '';
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return new Blob([bytes.buffer as ArrayBuffer], { type: APK_MIME_TYPE });
  }

  private parseVersionCode(fileName: string): number | null {
    const match = /-(\d+)\.apk$/.exec(fileName);
    return match ? Number(match[1]) : null;
  }

  private persistCachedMeta(cached: ICachedApk) {
    try {
      localStorage.setItem(APK_META_CACHE_KEY, JSON.stringify(cached));
    } catch {
      return;
    }
  }

  private readPersistedMeta(): ICachedApk | null {
    try {
      const raw = localStorage.getItem(APK_META_CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as ICachedApk;
    } catch {
      return null;
    }
  }
}
