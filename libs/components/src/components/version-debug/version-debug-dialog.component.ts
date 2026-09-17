import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Device, DeviceId, DeviceInfo } from '@capacitor/device';
import { APP_VERSION } from '@picsa/environments/src/version';
import { PicsaTranslateModule, PicsaTranslateService } from '@picsa/i18n';
import { AppUserService } from '@picsa/shared/services/core/appUser.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { AppUpdateService, IAppUpdateDiagnostics } from '@picsa/shared/services/native/app-update';

@Component({
  selector: 'picsa-version-debug-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './version-debug-dialog.component.html',
  styleUrls: ['./version-debug-dialog.component.scss'],
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatSlideToggleModule, PicsaTranslateModule],
})
export class PicsaVersionDebugDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<PicsaVersionDebugDialogComponent>);
  private appUserService = inject(AppUserService);
  private appUpdateService = inject(AppUpdateService);
  private notificationService = inject(PicsaNotificationService);
  private translateService = inject(PicsaTranslateService, { optional: true });

  public appVersion = APP_VERSION;
  public isInternalTester = this.appUserService.isInternalTester;
  public fcmToken = this.appUserService.fcmToken;

  public isUpdateAvailable = this.appUpdateService.isUpdateAvailable;
  public isUpdateDownloading = this.appUpdateService.isUpdateDownloading;
  public isUpdateDownloaded = this.appUpdateService.isUpdateDownloaded;

  public deviceInfo = signal<DeviceInfo | null>(null);
  public deviceId = signal<DeviceId | null>(null);
  public diagnostics = signal<IAppUpdateDiagnostics | null>(null);

  public formattedJson = computed(() => {
    const info = this.deviceInfo();
    const id = this.deviceId();
    const updateDiag = this.diagnostics();
    const payload = {
      app_version: this.appVersion,
      user_id: this.appUserService.userId(),
      is_internal_tester: this.isInternalTester(),
      notification_token: this.fcmToken(),
      device_id: id?.identifier,
      operatingSystem: info?.operatingSystem,
      osVersion: info?.osVersion,
      webViewVersion: info?.webViewVersion,
      update: updateDiag,
    };
    return JSON.stringify(payload, null, 2);
  });

  async ngOnInit() {
    await this.refreshDiagnostics();
  }

  public async refreshDiagnostics(): Promise<void> {
    try {
      const [info, id, updateDiag] = await Promise.all([
        Device.getInfo().catch(() => null),
        Device.getId().catch(() => null),
        this.appUpdateService.checkUpdateStatus(),
      ]);

      this.deviceInfo.set(info);
      this.deviceId.set(id);
      this.diagnostics.set(updateDiag);
    } catch {
      // ignore
    }
  }

  public onToggleTester(checked: boolean): void {
    this.appUserService.setInternalTester(checked, true);
    const msg = checked
      ? (this.translateService?.instant('Internal Tester mode enabled') ?? 'Internal Tester mode enabled')
      : (this.translateService?.instant('Internal Tester mode disabled') ?? 'Internal Tester mode disabled');
    this.notificationService.showSuccessNotification(msg);
  }

  public async copyDebugJson(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.formattedJson());
      const msg =
        this.translateService?.instant('Diagnostics copied to clipboard') ?? 'Diagnostics copied to clipboard';
      this.notificationService.showSuccessNotification(msg);
    } catch {
      const msg = this.translateService?.instant('Failed to copy diagnostics') ?? 'Failed to copy diagnostics';
      this.notificationService.showErrorNotification(msg);
    }
  }

  public async copyNotificationToken(): Promise<void> {
    const token = this.fcmToken();
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      const msg =
        this.translateService?.instant('Notification token copied to clipboard') ??
        'Notification token copied to clipboard';
      this.notificationService.showSuccessNotification(msg);
    } catch {
      const msg =
        this.translateService?.instant('Failed to copy notification token') ?? 'Failed to copy notification token';
      this.notificationService.showErrorNotification(msg);
    }
  }

  public async startDownload(): Promise<void> {
    await this.appUpdateService.startFlexibleUpdate();
  }

  public async completeUpdate(): Promise<void> {
    await this.appUpdateService.completeUpdate();
  }

  public async openStore(): Promise<void> {
    await this.appUpdateService.openStore();
  }

  public close(): void {
    this.dialogRef.close();
  }
}
