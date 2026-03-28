import { inject, Injectable, NgZone } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import { AppOpenPromptComponent } from './app-open-prompt.component';

export class DeepLinksServiceConfig {
  /** Web url associated with deep links */
  baseUrl: string;
}

@Injectable({ providedIn: 'root' })
/**
 * Provides support for:
 * 1. Deep linking: Opens native app when user clicks links to picsa.app (via App Links/assetlinks.json)
 * 2. App promotion: Shows banner on mobile web to encourage Play Store installation
 *
 * Note: On mobile web, we show the banner because if the app was installed,
 * App Links would have automatically opened the native app instead.
 */
export class DeepLinksService {
  config = inject(DeepLinksServiceConfig, { optional: true });
  private zone = inject(NgZone);
  private router = inject(Router);
  private bottomSheet = inject(MatBottomSheet);

  public init() {
    if (Capacitor.isNativePlatform()) {
      const baseUrl = this.config?.baseUrl || location.origin;
      App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        this.zone.run(() => {
          const slug = event.url.replace(`${baseUrl}/`, '');
          if (slug) {
            this.router.navigateByUrl(slug);
          }
        });
      });
    } else {
      if (this.isMobile()) {
        // open prompt after slight delay to allow time for app to render
        setTimeout(() => {
          this.toggleAppOpenTargetSheet();
        }, 2500);
      }
    }
  }

  private isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Present a bottom sheet to encourage user to use native version of app if running
   * on mobile
   */
  private toggleAppOpenTargetSheet() {
    this.bottomSheet.open(AppOpenPromptComponent);
  }
}
