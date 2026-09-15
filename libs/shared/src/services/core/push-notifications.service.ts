import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { ActionPerformed, PushNotifications, PushNotificationSchema, Token } from '@capacitor/push-notifications';

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

  public async initializePushNotifications() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    try {
      // Check if permission is already granted
      const permResult = await PushNotifications.checkPermissions();

      if (permResult.receive === 'prompt' || permResult.receive === 'prompt-with-rationale') {
        // Request permissions
        const reqResult = await PushNotifications.requestPermissions();
        if (reqResult.receive !== 'granted') {
          console.warn('[Push] Notification permission was denied');
          return;
        }
      }

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

      // Register with Apple / Google to receive push via FCM
      await PushNotifications.register();

      // Remove any existing listeners to prevent duplicates
      await PushNotifications.removeAllListeners();

      // Add listeners
      PushNotifications.addListener('registration', (token: Token) => {
        console.log('[Push] Registration success:', token.value);
        this.sendTokenToServer(token.value);
      });

      PushNotifications.addListener('registrationError', (error: any) => {
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
    } catch (err) {
      console.error('[Push] Error initializing push notifications:', err);
    }
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

  private async handleNotificationClick(actionPerformed: ActionPerformed) {
    const data = actionPerformed.notification?.data ?? {};
    const action = data.action ?? data.type;
    if (action === 'app_update' || action === 'update') {
      await this.appUpdateService.checkForUpdates();
      if (data.openStore) {
        await this.appUpdateService.openStore();
      }
    } else if (data.route) {
      this.router.navigate([data.route]);
    }
  }
}
