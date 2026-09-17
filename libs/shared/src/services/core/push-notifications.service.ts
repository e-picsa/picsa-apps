import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor, PermissionState } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotifications,
  PushNotificationSchema,
  RegistrationError,
  Token,
} from '@capacitor/push-notifications';

import { AppUpdateService } from '../native/app-update';
import { AppUserService } from './appUser.service';
import { PicsaNotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class PicsaPushNotificationService {
  private appUserService = inject(AppUserService);
  private appUpdateService = inject(AppUpdateService);
  private notificationService = inject(PicsaNotificationService);
  private router = inject(Router);

  public permissionStatus = signal<PermissionState | null>(null);
  public isPermissionGranted = computed(() => this.permissionStatus() === 'granted');

  /**
   * Check permissions and initialize listeners if already granted.
   * Does NOT proactively prompt the user on startup.
   */
  public async initializePushNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    try {
      const permResult = await PushNotifications.checkPermissions();
      this.permissionStatus.set(permResult.receive);

      if (permResult.receive === 'granted') {
        await this.registerPushListeners();
      }
    } catch (err) {
      console.error('[Push] Error initializing push notifications:', err);
    }
  }

  /**
   * Prompt the user for push notification permissions on-demand.
   * Triggered by user interaction (e.g. notification banner).
   */
  public async requestNotificationPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          const res = await Notification.requestPermission();
          const granted = res === 'granted';
          this.permissionStatus.set(granted ? 'granted' : 'denied');
          return granted;
        } catch {
          // ignore
        }
      }
      this.permissionStatus.set('granted');
      return true;
    }

    try {
      const reqResult = await PushNotifications.requestPermissions();
      this.permissionStatus.set(reqResult.receive);

      if (reqResult.receive === 'granted') {
        await this.registerPushListeners();
        return true;
      }
      return false;
    } catch (err) {
      console.error('[Push] Error requesting push notification permissions:', err);
      return false;
    }
  }

  private async registerPushListeners(): Promise<void> {
    // Create standard notification channel for Android 8.0+ (API 26+)
    if (Capacitor.getPlatform() === 'android') {
      await PushNotifications.createChannel({
        id: 'default',
        name: 'General',
        description: 'General notifications and release updates',
        importance: 4, // HIGH
        visibility: 1, // PUBLIC
        sound: 'default',
        vibration: true,
      });
    }

    // Remove any existing listeners to prevent duplicates
    await PushNotifications.removeAllListeners();

    // Add listeners before registering so token and notification events are not missed
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('[Push] Registration success');
      this.sendTokenToServer(token.value);
    });

    PushNotifications.addListener('registrationError', (error: RegistrationError) => {
      console.error('[Push] Error on registration:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('[Push] Received in foreground:', notification);
      this.handleForegroundNotification(notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', async (notification: ActionPerformed) => {
      console.log('[Push] Action performed:', notification);
      await this.handleNotificationClick(notification);
    });

    // Register with Apple / Google to receive push via FCM
    await PushNotifications.register();
  }

  private sendTokenToServer(token: string) {
    this.appUserService.setFcmToken(token);
  }

  private handleForegroundNotification(notification: PushNotificationSchema) {
    const title = notification.title ?? 'PICSA';
    const body = notification.body ? `: ${notification.body}` : '';
    this.notificationService.showUserNotification(
      { message: `${title}${body}`, matIcon: 'notifications' },
      { duration: 6000 },
    );
  }

  private async handleNotificationClick(notification: ActionPerformed) {
    const data = notification.notification?.data;
    if (data?.action === 'app_update' || data?.openStore) {
      await this.appUpdateService.openStore();
      return;
    }
    if (data?.url) {
      this.router.navigateByUrl(data.url);
    }
  }
}
