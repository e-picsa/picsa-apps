import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ActionPerformed, PushNotifications, PushNotificationSchema, Token } from '@capacitor/push-notifications';

@Injectable({
  providedIn: 'root',
})
export class PicsaPushNotificationService {
  //constructor() {}

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
          console.error('Push notification permission was denied');
          return;
        }
      }
      // Register with Apple / Google to receive push via FCM
      await PushNotifications.register();

      // Remove any existing listeners to prevent duplicates
      await PushNotifications.removeAllListeners();

      // Add listeners
      PushNotifications.addListener('registration', (token: Token) => {
        console.log('Push registration success');
        // in case we have logic to save and update device tokens
        //this.sendTokenToServer(token.value);
      });

      PushNotifications.addListener('registrationError', (error: any) => {
        // handle error logic
        console.error('Error on registration:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push received');
        // Handle foreground notification if required
        this.handleForegroundNotification(notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push action performed');
        // Handle notification click
        this.handleNotificationClick(notification);
      });
    } catch (err) {
      console.error('Error initializing push notifications:', err);
    }
  }

  private async sendTokenToServer(token: string) {
    //TODO: Implement sending token to your backend if required
    //guidence on where we can save this
  }

  private handleForegroundNotification(notification: PushNotificationSchema) {
    // Implement custom foreground notification handling
  }

  private handleNotificationClick(actionPerformed: ActionPerformed) {
    // Implement navigation or other actions when notification is clicked
    const notification = actionPerformed.notification;
    // in the case notification has extra infromations like a route to navigate to
    // this.router.navigate([notification.data.route]);
  }
}
