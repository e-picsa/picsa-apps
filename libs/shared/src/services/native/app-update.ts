import { Injectable } from '@angular/core';
import { AppUpdate, AppUpdateAvailability, AppUpdateInfo } from '@capawesome/capacitor-app-update';

@Injectable({
  providedIn: 'root',
})
export class AppUpdateService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  /** Checks for app updates and starts a flexible update if allowed */
  async checkForUpdates() {
    try {
      const appUpdateInfo: AppUpdateInfo = await AppUpdate.getAppUpdateInfo();
      if (
        appUpdateInfo.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE &&
        appUpdateInfo.flexibleUpdateAllowed
      ) {
        await this.startFlexibleUpdate();
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  /** Starts a flexible update process */
  private async startFlexibleUpdate() {
    try {
      await AppUpdate.startFlexibleUpdate();
      console.log('Flexible update started');

      // Complete the update once it's downloaded
      await AppUpdate.completeFlexibleUpdate();
      console.log('Flexible update completed successfully');
    } catch (error) {
      console.error('Error during flexible update:', error);
    }
  }
}
