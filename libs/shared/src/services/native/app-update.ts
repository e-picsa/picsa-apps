import { computed, inject, Injectable, signal } from '@angular/core';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import {
  AppUpdate,
  AppUpdateAvailability,
  AppUpdateInfo,
  FlexibleUpdateInstallStatus,
  FlexibleUpdateState,
} from '@capawesome/capacitor-app-update';

import { PicsaNotificationService } from '../core/notification.service';

export interface IAppUpdateDiagnostics {
  isNative: boolean;
  availability: string;
  currentVersionCode?: string;
  currentVersionName?: string;
  availableVersionCode?: string;
  availableVersionName?: string;
  installStatus?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppUpdateService {
  private notificationService = inject(PicsaNotificationService);

  private listenerHandle: PluginListenerHandle | null = null;

  public updateAvailability = signal<AppUpdateAvailability>(AppUpdateAvailability.UNKNOWN);
  public installStatus = signal<FlexibleUpdateInstallStatus | null>(null);
  public updateInfo = signal<AppUpdateInfo | null>(null);
  public bytesDownloaded = signal<number | undefined>(undefined);
  public totalBytesToDownload = signal<number | undefined>(undefined);

  public isUpdateAvailable = computed(() => this.updateAvailability() === AppUpdateAvailability.UPDATE_AVAILABLE);
  public isUpdateDownloading = computed(() => this.installStatus() === FlexibleUpdateInstallStatus.DOWNLOADING);
  public isUpdateDownloaded = computed(() => this.installStatus() === FlexibleUpdateInstallStatus.DOWNLOADED);

  /** Checks for app updates and starts a flexible update if allowed */
  async checkForUpdates(): Promise<AppUpdateInfo | null> {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }
    try {
      const appUpdateInfo: AppUpdateInfo = await AppUpdate.getAppUpdateInfo();
      this.updateInfo.set(appUpdateInfo);
      this.updateAvailability.set(appUpdateInfo.updateAvailability);
      this.installStatus.set(appUpdateInfo.installStatus ?? null);

      if (appUpdateInfo.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) {
        this.notificationService.showSuccessNotification(
          'A new update has been downloaded. Restart the app to apply.',
          { duration: 10000 },
        );
      } else if (
        appUpdateInfo.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE &&
        appUpdateInfo.flexibleUpdateAllowed
      ) {
        await this.startFlexibleUpdate();
      }
      return appUpdateInfo;
    } catch (error) {
      console.error('[AppUpdate] Error checking for updates:', error);
      return null;
    }
  }

  /** Starts a flexible update process and listens for download state changes */
  public async startFlexibleUpdate(): Promise<void> {
    try {
      await this.ensureFlexibleUpdateListener();
      await AppUpdate.startFlexibleUpdate();
    } catch (error) {
      console.error('[AppUpdate] Error during flexible update:', error);
    }
  }

  /** Completes flexible update by restarting app */
  public async completeUpdate(): Promise<void> {
    try {
      await AppUpdate.completeFlexibleUpdate();
    } catch (error) {
      console.error('[AppUpdate] Error completing update:', error);
    }
  }

  /** Opens app entry in the Google Play Store */
  public async openStore(): Promise<void> {
    try {
      await AppUpdate.openAppStore({ androidPackageName: 'io.picsa.extension' });
    } catch (error) {
      console.error('[AppUpdate] Error opening app store:', error);
    }
  }

  /** Retrieves detailed diagnostics on update status for debug popups */
  public async checkUpdateStatus(): Promise<IAppUpdateDiagnostics> {
    if (!Capacitor.isNativePlatform()) {
      return { isNative: false, availability: 'WEB_NOT_SUPPORTED' };
    }
    try {
      const info = await AppUpdate.getAppUpdateInfo();
      this.updateInfo.set(info);
      this.updateAvailability.set(info.updateAvailability);
      this.installStatus.set(info.installStatus ?? null);
      return {
        isNative: true,
        availability: this.formatAvailability(info.updateAvailability),
        currentVersionCode: info.currentVersionCode,
        currentVersionName: info.currentVersionName,
        availableVersionCode: info.availableVersionCode,
        availableVersionName: info.availableVersionName,
        installStatus: info.installStatus !== undefined ? this.formatInstallStatus(info.installStatus) : undefined,
      };
    } catch (err: any) {
      return {
        isNative: true,
        availability: 'ERROR',
        error: err?.message ?? String(err),
      };
    }
  }

  private formatAvailability(availability: AppUpdateAvailability): string {
    switch (availability) {
      case AppUpdateAvailability.UPDATE_AVAILABLE:
        return 'UPDATE_AVAILABLE';
      case AppUpdateAvailability.UPDATE_NOT_AVAILABLE:
        return 'UPDATE_NOT_AVAILABLE';
      case AppUpdateAvailability.UPDATE_IN_PROGRESS:
        return 'UPDATE_IN_PROGRESS';
      default:
        return 'UNKNOWN';
    }
  }

  private formatInstallStatus(status: FlexibleUpdateInstallStatus): string {
    switch (status) {
      case FlexibleUpdateInstallStatus.DOWNLOADING:
        return 'DOWNLOADING';
      case FlexibleUpdateInstallStatus.DOWNLOADED:
        return 'DOWNLOADED';
      case FlexibleUpdateInstallStatus.INSTALLING:
        return 'INSTALLING';
      case FlexibleUpdateInstallStatus.INSTALLED:
        return 'INSTALLED';
      case FlexibleUpdateInstallStatus.FAILED:
        return 'FAILED';
      case FlexibleUpdateInstallStatus.CANCELED:
        return 'CANCELED';
      case FlexibleUpdateInstallStatus.PENDING:
        return 'PENDING';
      default:
        return 'UNKNOWN';
    }
  }

  private async ensureFlexibleUpdateListener(): Promise<void> {
    if (this.listenerHandle) return;
    this.listenerHandle = await AppUpdate.addListener('onFlexibleUpdateStateChange', (state: FlexibleUpdateState) => {
      console.log('[AppUpdate] Flexible update state change:', state);
      this.installStatus.set(state.installStatus);
      this.bytesDownloaded.set(state.bytesDownloaded);
      this.totalBytesToDownload.set(state.totalBytesToDownload);

      if (state.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) {
        this.notificationService.showSuccessNotification(
          'A new update has been downloaded. Restart the app to apply.',
          { duration: 10000 },
        );
      }
    });
  }
}
