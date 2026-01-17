import { Injectable, NgZone, Optional } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import { AppOpenPromptComponent } from './app-open-prompt.component';

export class DeepLinksServiceConfig {
  /** Web url associated with deep links */
  baseUrl: string;
  /** E.g. firebase dynamic link */
  appDynamicLink: string;
}

@Injectable({ providedIn: 'root' })
/**
 * Provide support for opening deep links within app
 * https://capacitorjs.com/docs/guides/deep-links#angular
 */
export class DeepLinksService {
  constructor(
    @Optional() public config: DeepLinksServiceConfig,
    private zone: NgZone,
    private router: Router,
    private bottomSheet: MatBottomSheet,
  ) {}

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
