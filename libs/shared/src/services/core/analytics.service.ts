import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { FirebaseAnalytics } from '@capacitor-community/firebase-analytics';
import { ENVIRONMENT } from '@picsa/environments';

@Injectable({ providedIn: 'root' })
/**
 *
 * https://www.npmjs.com/package/@capacitor-community/firebase-analytics
 */
export class AnalyticsService {
  public firebaseAnalytics = FirebaseAnalytics;

  public init(router: Router) {
    FirebaseAnalytics.initializeFirebase(ENVIRONMENT.firebase);
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
          name: 'screen_view',
          params: { screen_name: location.pathname },
        });
      }
    });
  }
}
