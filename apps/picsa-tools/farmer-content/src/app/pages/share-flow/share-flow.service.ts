import { inject, Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { PicsaCommonComponentsService } from '@picsa/components';
import { FileService } from '@picsa/shared/services/core/file.service';
import { NativeStorageService } from '@picsa/shared/services/native';

export type ShareFlowStatus = 'idle' | 'success' | 'error';

const APP_APK_ASSET_PATH = 'share/epicsa-app.apk';
const APP_APK_FILENAME = 'E-PICSA-App.apk';
const APP_APK_MIMETYPE = 'application/vnd.android.package-archive';

@Injectable({ providedIn: 'root' })
export class FarmerShareFlowService {
  private componentsService = inject(PicsaCommonComponentsService);
  private fileService = inject(FileService);
  private nativeStorageService = inject(NativeStorageService);

  public readonly shareStatus = signal<ShareFlowStatus>('idle');
  public readonly shareStatusLabel = signal('');

  public enterShareFlow() {
    this.shareStatus.set('idle');
    this.shareStatusLabel.set('');
    this.componentsService.patchHeader({ hideHeader: true, hideBackButton: true });
  }

  public exitShareFlow() {
    this.componentsService.patchHeader({ hideHeader: false, hideBackButton: false });
  }

  public setShareError(message: string) {
    this.shareStatus.set('error');
    this.shareStatusLabel.set(message);
  }

  public setShareSuccess(message = 'Shared successfully') {
    this.shareStatus.set('success');
    this.shareStatusLabel.set(message);
  }

  public shareAppApk() {
    return this.runShareAction(async () => {
      const blob: Blob = await this.fileService.readAssetFile(APP_APK_ASSET_PATH, 'blob');
      if (!blob) {
        throw new Error('E-PICSA App install file not found');
      }

      if (Capacitor.isNativePlatform()) {
        await this.nativeStorageService.ready();
        const fileInfo = await this.nativeStorageService.writeFile(blob, APP_APK_FILENAME);
        if (!fileInfo) {
          throw new Error('Failed to prepare E-PICSA App install file');
        }
        const cacheUri = await this.nativeStorageService.copyFileToCache(fileInfo.uri, APP_APK_FILENAME);
        await Share.share({
          title: 'E-PICSA App',
          dialogTitle: 'Share E-PICSA App',
          files: [cacheUri],
        });
      } else {
        const file = new File([blob], APP_APK_FILENAME, { type: APP_APK_MIMETYPE });
        await navigator.share({ title: 'E-PICSA App', files: [file] });
      }
    });
  }

  public async runShareAction(action: () => Promise<unknown>) {
    try {
      await action();
      this.setShareSuccess();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      this.setShareError('Unable to share');
    }
  }
}
