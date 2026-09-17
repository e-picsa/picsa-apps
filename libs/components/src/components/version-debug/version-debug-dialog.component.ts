import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Device, DeviceId, DeviceInfo } from '@capacitor/device';
import { APP_VERSION } from '@picsa/environments/src/version';
import { PicsaTranslateModule } from '@picsa/i18n';
import { AppUserService } from '@picsa/shared/services/core/appUser.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { AppUpdateService, IAppUpdateDiagnostics } from '@picsa/shared/services/native/app-update';

@Component({
  selector: 'picsa-version-debug-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatSlideToggleModule, PicsaTranslateModule],
  template: `
    <div class="p-6 max-w-lg w-full">
      <!-- Dialog Header -->
      <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-neutral-700">
        <div class="flex items-center gap-2">
          <mat-icon class="text-primary">developer_mode</mat-icon>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white m-0">
            {{ 'Diagnostics & Updates' | translate }}
          </h2>
        </div>
        <button matIconButton (click)="close()" [attr.aria-label]="'Close' | translate">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Dialog Body -->
      <div class="py-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <!-- Version & Build Info -->
        <div class="bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg flex items-center justify-between">
          <div>
            <div class="text-xs text-gray-500 dark:text-neutral-400 uppercase font-semibold">
              {{ 'App Version' | translate }}
            </div>
            <div class="text-base font-bold text-gray-900 dark:text-white">v{{ appVersion }}</div>
          </div>
          @if (diagnostics()?.currentVersionCode) {
            <div class="text-right">
              <div class="text-xs text-gray-500 dark:text-neutral-400 uppercase font-semibold">
                {{ 'Build Code' | translate }}
              </div>
              <div class="text-sm font-mono text-gray-800 dark:text-neutral-200">
                {{ diagnostics()?.currentVersionCode }}
              </div>
            </div>
          }
        </div>

        <!-- Internal Tester Switch -->
        <div class="p-3 border border-gray-200 dark:border-neutral-700 rounded-lg flex items-center justify-between">
          <div class="pr-3">
            <div class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ 'Internal Tester Mode' | translate }}
            </div>
            <div class="text-xs text-gray-500 dark:text-neutral-400">
              {{ 'Identifies this device as a testing user in Supabase' | translate }}
            </div>
          </div>
          <mat-slide-toggle [checked]="isInternalTester()" (change)="onToggleTester($event.checked)" color="primary">
          </mat-slide-toggle>
        </div>

        <!-- Push Notification Token Card -->
        <div class="p-3 border border-gray-200 dark:border-neutral-700 rounded-lg space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-xs font-semibold uppercase text-gray-500 dark:text-neutral-400">
              {{ 'Notification Token' | translate }}
            </div>
            @if (fcmToken()) {
              <span
                class="text-[11px] font-mono text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded font-medium"
              >
                {{ 'Active' | translate }}
              </span>
            } @else {
              <span
                class="text-[11px] text-gray-500 dark:text-neutral-400 bg-gray-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded"
              >
                {{ 'Not registered' | translate }}
              </span>
            }
          </div>
          <div class="flex items-center gap-2">
            <div
              class="flex-1 text-xs font-mono bg-gray-50 dark:bg-neutral-800 p-2 rounded border border-gray-200 dark:border-neutral-700 truncate select-all text-gray-800 dark:text-neutral-200"
              [title]="fcmToken() ?? ('No notification token registered' | translate)"
            >
              {{ fcmToken() ?? ('No notification token registered' | translate) }}
            </div>
            @if (fcmToken()) {
              <button
                matIconButton
                (click)="copyNotificationToken()"
                [attr.aria-label]="'Copy notification token' | translate"
              >
                <mat-icon class="text-sm">content_copy</mat-icon>
              </button>
            }
          </div>
        </div>

        <!-- Google Play Update Status Card -->
        <div class="p-3 border border-gray-200 dark:border-neutral-700 rounded-lg space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-xs font-semibold uppercase text-gray-500 dark:text-neutral-400">
              {{ 'Google Play Update' | translate }}
            </div>
            <span
              class="text-xs font-semibold px-2 py-0.5 rounded"
              [class.bg-green-100]="isUpdateAvailable() || isUpdateDownloaded()"
              [class.text-green-700]="isUpdateAvailable() || isUpdateDownloaded()"
              [class.bg-gray-100]="!isUpdateAvailable() && !isUpdateDownloaded()"
              [class.text-gray-700]="!isUpdateAvailable() && !isUpdateDownloaded()"
            >
              {{ diagnostics()?.availability ?? ('Checking...' | translate) }}
            </span>
          </div>

          @if (isUpdateDownloaded()) {
            <div
              class="p-2 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded text-xs flex items-center justify-between"
            >
              <span>{{ 'Update is downloaded and ready to apply!' | translate }}</span>
              <button matButton="filled" color="primary" (click)="completeUpdate()">
                {{ 'Restart App' | translate }}
              </button>
            </div>
          } @else if (isUpdateDownloading()) {
            <div class="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <mat-icon class="animate-spin text-sm">sync</mat-icon>
              <span>{{ 'Downloading update in background...' | translate }}</span>
            </div>
          } @else if (isUpdateAvailable()) {
            <div class="flex items-center justify-between pt-1">
              <span class="text-xs text-gray-600 dark:text-neutral-300">
                {{ 'New version available:' | translate }}
                {{ diagnostics()?.availableVersionName || diagnostics()?.availableVersionCode }}
              </span>
              <button matButton="filled" color="primary" (click)="startDownload()">
                {{ 'Download' | translate }}
              </button>
            </div>
          }

          @if (diagnostics()?.error) {
            <div class="text-xs text-amber-600 dark:text-amber-400">
              {{ diagnostics()?.error }}
            </div>
          }
        </div>

        <!-- Raw Diagnostic JSON details -->
        <details class="text-xs border border-gray-200 dark:border-neutral-700 rounded-lg p-2">
          <summary class="font-semibold text-gray-700 dark:text-neutral-300 cursor-pointer select-none">
            {{ 'View Full System JSON' | translate }}
          </summary>
          <pre
            class="mt-2 p-2 bg-gray-100 dark:bg-neutral-900 rounded overflow-x-auto text-[11px] leading-tight font-mono text-gray-800 dark:text-neutral-200"
            >{{ formattedJson() }}</pre
          >
        </details>
      </div>

      <!-- Dialog Actions -->
      <div
        class="pt-4 border-t border-gray-200 dark:border-neutral-700 flex flex-wrap items-center justify-between gap-2"
      >
        <div class="flex items-center gap-2">
          <button matButton="filled" color="primary" (click)="copyDebugJson()">
            <mat-icon class="text-sm">content_copy</mat-icon>
            {{ 'Copy Debug Info' | translate }}
          </button>
          <button matButton (click)="refreshDiagnostics()">
            <mat-icon class="text-sm">refresh</mat-icon>
            {{ 'Refresh' | translate }}
          </button>
        </div>

        <div class="flex items-center gap-2">
          @if (diagnostics()?.isNative) {
            <button matButton (click)="openStore()">
              <mat-icon class="text-sm">open_in_new</mat-icon>
              {{ 'Play Store' | translate }}
            </button>
          }
          <button matButton (click)="close()">
            {{ 'Close' | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PicsaVersionDebugDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<PicsaVersionDebugDialogComponent>);
  private appUserService = inject(AppUserService);
  private appUpdateService = inject(AppUpdateService);
  private notificationService = inject(PicsaNotificationService);

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
    this.notificationService.showSuccessNotification(
      checked ? 'Internal Tester mode enabled' : 'Internal Tester mode disabled',
    );
  }

  public async startDownload(): Promise<void> {
    await this.appUpdateService.startFlexibleUpdate();
    await this.refreshDiagnostics();
  }

  public async completeUpdate(): Promise<void> {
    await this.appUpdateService.completeUpdate();
  }

  public async openStore(): Promise<void> {
    await this.appUpdateService.openStore();
  }

  public async copyNotificationToken(): Promise<void> {
    const token = this.fcmToken();
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      this.notificationService.showSuccessNotification('Notification token copied to clipboard');
    } catch {
      this.notificationService.showErrorNotification('Failed to copy to clipboard');
    }
  }

  public async copyDebugJson(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.formattedJson());
      this.notificationService.showSuccessNotification('Diagnostics copied to clipboard');
    } catch {
      this.notificationService.showErrorNotification('Failed to copy to clipboard');
    }
  }

  public close(): void {
    this.dialogRef.close();
  }
}
