import { Clipboard } from '@angular/cdk/clipboard';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { of } from 'rxjs';

import { FileService } from '../core/file.service';
import { PicsaNotificationService } from '../core/notification.service';
import { SupabaseService } from '../core/supabase/supabase.service';
import { APK_LATEST_FILE, AppDistributionService } from './app-distribution.service';

jest.mock('@capacitor/core', () => {
  const actual = jest.requireActual('@capacitor/core');
  return { ...actual, Capacitor: { ...actual.Capacitor, isNativePlatform: jest.fn() } };
});
jest.mock('@capacitor/filesystem', () => ({
  Directory: { Data: 'DATA', Cache: 'CACHE' },
  Filesystem: { stat: jest.fn(), deleteFile: jest.fn(), copy: jest.fn(), readFile: jest.fn() },
}));
jest.mock('@capacitor/share', () => ({ Share: { canShare: jest.fn(), share: jest.fn() } }));
jest.mock('capacitor-blob-writer', () => ({ __esModule: true, default: jest.fn() }));

describe('AppDistributionService', () => {
  let service: AppDistributionService;
  let httpGet: jest.Mock;
  let storageLink: jest.Mock;
  let downloadFile: jest.Mock;

  const meta = {
    versionCode: 5013000,
    fileName: 'e-picsa-universal-5013000.apk',
    fileSize: 42_000_000,
    uploadedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    httpGet = jest.fn();
    storageLink = jest
      .fn()
      .mockReturnValue(`https://demo.supabase.co/storage/v1/object/public/apk-releases/${APK_LATEST_FILE}`);
    downloadFile = jest.fn();

    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

    TestBed.configureTestingModule({
      providers: [
        AppDistributionService,
        { provide: HttpClient, useValue: { get: httpGet } },
        { provide: SupabaseService, useValue: { storage: { getPublicLink: storageLink }, config: undefined } },
        { provide: FileService, useValue: { downloadFile } },
        {
          provide: PicsaNotificationService,
          useValue: { showSuccessNotification: jest.fn(), showUserNotification: jest.fn() },
        },
        { provide: Clipboard, useValue: { copy: jest.fn() } },
      ],
    });
    service = TestBed.inject(AppDistributionService);
  });

  it('creates service with idle initial state', () => {
    expect(service.status()).toBe('idle');
    expect(service.progress()).toBe(0);
    expect(service.cached()).toBeNull();
    expect(service.isDownloaded()).toBe(false);
  });

  it('checkLatest stores metadata and returns it', async () => {
    httpGet.mockReturnValue(of(meta));
    (Filesystem.stat as jest.Mock).mockRejectedValue({ code: 'OS-PLUG-FILE-0008' });

    const result = await service.checkLatest();

    expect(result).toEqual(meta);
    expect(service.latestMeta()).toEqual(meta);
    expect(service.status()).toBe('idle');
  });

  it('checkLatest sets error state on failure but keeps offline cache usable', async () => {
    httpGet.mockReturnValue({
      pipe: jest.fn(),
      subscribe: jest.fn(),
    });
    // force http.get to throw when subscribed via firstValueFrom
    const { throwError } = await import('rxjs');
    httpGet.mockReturnValue(throwError(() => new Error('offline')));
    (Filesystem.stat as jest.Mock).mockRejectedValue({ code: 'OS-PLUG-FILE-0008' });

    const result = await service.checkLatest();

    expect(result).toBeNull();
    expect(service.status()).toBe('error');
    expect(service.error()).toContain('Could not check');
  });

  it('refreshCachedStatus reports null when no file cached', async () => {
    (Filesystem.stat as jest.Mock).mockRejectedValue({ code: 'OS-PLUG-FILE-0008' });

    const result = await service.refreshCachedStatus();

    expect(result).toBeNull();
    expect(service.cached()).toBeNull();
    expect(service.isDownloaded()).toBe(false);
  });

  it('refreshCachedStatus reports cached version and size', async () => {
    (Filesystem.stat as jest.Mock).mockResolvedValue({ size: 42_000_000 });
    localStorage.setItem(
      'picsa-apk-releases||cached-meta',
      JSON.stringify({
        fileName: meta.fileName,
        fileSize: 1,
        path: `picsa_apk/${meta.fileName}`,
        versionCode: 5013000,
      }),
    );

    const result = await service.refreshCachedStatus();

    expect(Filesystem.stat).toHaveBeenCalledWith({ path: `picsa_apk/${meta.fileName}`, directory: Directory.Data });
    expect(result?.fileSize).toBe(42_000_000);
    expect(result?.versionCode).toBe(5013000);
    expect(service.isDownloaded()).toBe(true);
  });

  it('clearCachedApk deletes file and resets state', async () => {
    (Filesystem.stat as jest.Mock).mockResolvedValue({ size: 10 });
    (Filesystem.deleteFile as jest.Mock).mockResolvedValue(undefined);
    localStorage.setItem(
      'picsa-apk-releases||cached-meta',
      JSON.stringify({ fileName: meta.fileName, fileSize: 10, path: `picsa_apk/${meta.fileName}`, versionCode: 1 }),
    );
    await service.refreshCachedStatus();

    await service.clearCachedApk();

    expect(Filesystem.deleteFile).toHaveBeenCalledWith({
      path: `picsa_apk/${meta.fileName}`,
      directory: Directory.Data,
    });
    expect(service.cached()).toBeNull();
  });

  it('shareCachedApk throws when nothing downloaded', async () => {
    (Filesystem.stat as jest.Mock).mockRejectedValue({ code: 'OS-PLUG-FILE-0008' });
    await expect(service.shareCachedApk()).rejects.toThrow('No downloaded app package found');
  });

  describe('shareCachedApk', () => {
    const originalCanShare = (navigator as any).canShare;
    const originalShare = (navigator as any).share;

    /** Seed a cached APK via persisted meta + stat mock */
    async function seedCachedApk() {
      localStorage.setItem(
        'picsa-apk-releases||cached-meta',
        JSON.stringify({
          fileName: meta.fileName,
          fileSize: 42_000_000,
          path: `picsa_apk/${meta.fileName}`,
          versionCode: 5013000,
        }),
      );
      (Filesystem.stat as jest.Mock).mockResolvedValue({ size: 42_000_000 });
      return service.refreshCachedStatus();
    }

    afterEach(() => {
      (navigator as any).canShare = originalCanShare;
      (navigator as any).share = originalShare;
    });

    it('on native copies APK to cache dir (keeping .apk extension) and opens share sheet with file', async () => {
      await seedCachedApk();
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Filesystem.copy as jest.Mock).mockResolvedValue({ uri: 'file:///cache/e-picsa-universal-5013000.apk' });
      (Share.share as jest.Mock).mockResolvedValue({});

      await service.shareCachedApk();

      // FileProvider-safe: native sheet only serves files from cache dir
      expect(Filesystem.copy).toHaveBeenCalledWith({
        from: `picsa_apk/${meta.fileName}`,
        directory: Directory.Data,
        to: meta.fileName,
        toDirectory: Directory.Cache,
      });
      expect(Share.share).toHaveBeenCalledWith({
        title: meta.fileName,
        text: 'E-PICSA app installer',
        files: ['file:///cache/e-picsa-universal-5013000.apk'],
        dialogTitle: 'Share App',
      });
    });

    it('on web shares cached file via navigator.share with APK mime type', async () => {
      await seedCachedApk();
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      (navigator as any).canShare = jest.fn().mockReturnValue(true);
      (navigator as any).share = jest.fn().mockResolvedValue(undefined);
      (Filesystem.readFile as jest.Mock).mockResolvedValue({ data: btoa('fake-apk-bytes') });

      await service.shareCachedApk();

      expect(Filesystem.copy).toHaveBeenCalled();
      expect((navigator as any).share).toHaveBeenCalledTimes(1);
      const payload = (navigator as any).share.mock.calls[0][0];
      expect(payload.files).toHaveLength(1);
      expect(payload.files[0].name).toBe(meta.fileName);
      expect(payload.files[0].type).toBe('application/vnd.android.package-archive');
    });

    it('on web without file-share support throws', async () => {
      await seedCachedApk();
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      (navigator as any).canShare = undefined;
      (navigator as any).share = undefined;

      await expect(service.shareCachedApk()).rejects.toThrow('File sharing not supported');
    });
  });

  it('downloadApk drives progress to complete and caches file', async () => {
    httpGet.mockReturnValue(of(meta));
    const blob = new Blob(['apk'], { type: 'application/vnd.android.package-archive' });
    const { of: ofRx } = await import('rxjs');
    const updates$ = ofRx({ progress: 55, data: blob });
    downloadFile.mockReturnValue({ subscription: { unsubscribe: jest.fn() }, updates$ });
    const writeBlob = (await import('capacitor-blob-writer')).default as jest.Mock;
    writeBlob.mockResolvedValue('cache-path');
    (Filesystem.stat as jest.Mock).mockResolvedValue({ size: blob.size });

    await service.downloadApk();

    expect(service.progress()).toBe(100);
    expect(service.status()).toBe('complete');
    expect(service.cached()?.fileName).toBe(meta.fileName);
    expect(writeBlob).toHaveBeenCalled();
  });

  it('shareDownloadLink copies Play Store link when native share unavailable', async () => {
    (Share.canShare as jest.Mock).mockResolvedValue({ value: false });
    const clipboard = TestBed.inject(Clipboard);
    await service.shareDownloadLink();
    expect(clipboard.copy).toHaveBeenCalledWith(expect.stringContaining('play.google.com'));
  });
});
