import { Clipboard } from '@angular/cdk/clipboard';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { PicsaTranslateModule } from '@picsa/i18n';
import { AppDistributionService } from '@picsa/shared/services/native';

import { ShareAppDialogComponent } from './share-app-dialog.component';

describe('ShareAppDialogComponent', () => {
  let component: ShareAppDialogComponent;
  let fixture: ComponentFixture<ShareAppDialogComponent>;
  let distribution: {
    latestMeta: ReturnType<typeof signal>;
    cached: ReturnType<typeof signal>;
    status: ReturnType<typeof signal>;
    progress: ReturnType<typeof signal>;
    error: ReturnType<typeof signal>;
    isDownloading: ReturnType<typeof signal>;
    downloadUrl: jest.Mock;
    checkLatest: jest.Mock;
    downloadApk: jest.Mock;
    cancelDownload: jest.Mock;
    shareCachedApk: jest.Mock;
    shareDownloadLink: jest.Mock;
    clearCachedApk: jest.Mock;
  };

  beforeEach(async () => {
    distribution = {
      latestMeta: signal(null),
      cached: signal(null),
      status: signal('idle'),
      progress: signal(0),
      error: signal(null),
      isDownloading: signal(false),
      downloadUrl: jest.fn().mockReturnValue('https://demo.supabase.co/apk.apk'),
      checkLatest: jest.fn().mockResolvedValue(null),
      downloadApk: jest.fn().mockResolvedValue(undefined),
      cancelDownload: jest.fn(),
      shareCachedApk: jest.fn().mockResolvedValue(undefined),
      shareDownloadLink: jest.fn().mockResolvedValue(undefined),
      clearCachedApk: jest.fn().mockResolvedValue(undefined),
    };
    await TestBed.configureTestingModule({
      imports: [ShareAppDialogComponent, PicsaTranslateModule.forRoot()],
      providers: [
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: Clipboard, useValue: { copy: jest.fn() } },
        { provide: AppDistributionService, useValue: distribution },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShareAppDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and check latest release', () => {
    expect(component).toBeTruthy();
    expect(distribution.checkLatest).toHaveBeenCalled();
  });

  it('formats cached file size', () => {
    distribution.cached.set({ fileName: 'e-picsa-universal-1.apk', fileSize: 42_000_000, path: 'p', versionCode: 1 });
    fixture.detectChanges();
    expect(component.formattedSize()).toBe('42.0 MB');
  });

  it('falls back to KB for small builds instead of showing 0.0 MB', () => {
    distribution.cached.set(null);
    distribution.latestMeta.set({
      versionCode: 1,
      fileName: 'e-picsa-universal-latest.apk',
      fileSize: 12345,
      uploadedAt: '2026-01-01T00:00:00Z',
    });
    fixture.detectChanges();
    expect(component.formattedSize()).toBe('12 KB');
  });

  it('delegates download, share and delete actions to distribution service', async () => {
    await component.download();
    expect(distribution.downloadApk).toHaveBeenCalled();
    await component.shareFile();
    expect(distribution.shareCachedApk).toHaveBeenCalled();
    await component.deleteDownload();
    expect(distribution.clearCachedApk).toHaveBeenCalled();
  });

  it('closes dialog on close', () => {
    const dialogRef = TestBed.inject(MatDialogRef);
    component.close();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
});
