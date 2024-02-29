import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { FirebaseAnalytics } from '@capacitor-community/firebase-analytics';
import { APP_VERSION, ENVIRONMENT } from '@picsa/environments';

@Injectable({ providedIn: 'root' })
/**
 *
 * https://www.npmjs.com/package/@capacitor-community/firebase-analytics
 */
export class AnalyticsService {
  public firebaseAnalytics = FirebaseAnalytics;

  public async init(router: Router) {
    if (!Capacitor.isNativePlatform()) {
      // initialise for web (not required on android)
      await FirebaseAnalytics.initializeFirebase(ENVIRONMENT.firebase);
    }
    // disable analytics collection when running in dev
    await this.firebaseAnalytics.setCollectionEnabled({ enabled: ENVIRONMENT.production });
    this.trackScreenView(router);
  }
  /**
   * Firebase analytics appears to automatically track most pageviews
   * but include manual router tracking to ensure all router navigation tracked
   * by location pathname
   */
  private trackScreenView(router: Router) {
    router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.firebaseAnalytics.setScreenName({ screenName: location.pathname });
        this.firebaseAnalytics.logEvent({
          name: 'picsa_screen_view',
          params: { screen_name: location.pathname, app_version: APP_VERSION },
        });
      }
    });
  }

  // Method to track when users play a video
  public trackVideoPlay(videoId: string) {
    this.firebaseAnalytics.logEvent({
      name: 'picsa_video_play',
      params: { video_id: videoId },
    });
  }

  // Method to track when users opens resource file
  public trackResourceOpen(resourceId: string) {
    this.firebaseAnalytics.logEvent({
      name: 'picsa_resource_open',
      params: { resource_id: resourceId },
    });
  }
}
