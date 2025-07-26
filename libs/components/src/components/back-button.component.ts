import { Location } from '@angular/common';
import { Component, Input, NgZone, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router } from '@angular/router';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { Subject, takeUntil } from 'rxjs';

import { PicsaCommonComponentsService } from '../services/components.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'back-button',
  template: `
    @if (variant === 'primary') {
      <button mat-button color="primary" (click)="back()">
        <mat-icon>arrow_back</mat-icon>{{ 'Back' | translate }}
      </button>
    }
    @if (variant === 'white') {
      <button mat-button style="color:white" (click)="back()">
        <mat-icon>arrow_back</mat-icon>{{ 'Back' | translate }}
      </button>
    }
  `,
  imports: [MatButtonModule, MatIconModule, PicsaTranslateModule],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class BackButton implements OnDestroy {
  @Input() variant: 'white' | 'primary' = 'white';
  private componentDestroyed$ = new Subject<boolean>();

  constructor(
    private router: Router,
    private location: Location,
    private zone: NgZone,
    private componentService: PicsaCommonComponentsService,
  ) {
    // provide access to back method through component service
    componentService.back = () => this.back();

    this.subscribeToRouteChanges();

    if (Capacitor.isNativePlatform()) {
      this.handleNativeBackButtonPress();
    }
  }

  /**
   * Track browser history using component service to allow for shared history
   * across multiple buttons
   */
  private get history() {
    return this.componentService.navHistory;
  }

  public back() {
    return Capacitor.isNativePlatform() ? this.handleNativeBack() : this.handleWebBack();
  }

  private subscribeToRouteChanges() {
    this.router.events.pipe(takeUntil(this.componentDestroyed$)).subscribe((e) => {
      if (e instanceof NavigationEnd) {
        // HACK - ensure android doesn't store encoded URIs
        const url = decodeURIComponent(e.urlAfterRedirects);
        // Hack - Avoid accidental duplicate entries
        if (url !== this.history[this.history.length - 1]) {
          this.history.push(url);
        }
      }
    });
  }

  private async handleNativeBackButtonPress() {
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('backButton', (e) => {
        // attach callback to angular zone
        this.zone.run(() => this.handleNativeBack());
      });
    }
  }

  /**
   * Handle back navigation. Prefer to use history location back, however if initial nav
   * just navigate to home page. Adapated from:
   * https://nils-mehlhorn.de/posts/angular-navigate-back-previous-page
   *
   * TODO - complex routing requirements could likely be solved more easily when nav Api supported
   * https://caniuse.com/mdn-api_navigation
   */

  private handleWebBack() {
    if (this.history.length <= 1) {
      this.router.navigate(['/'], {
        replaceUrl: true,
      });
    } else {
      this.location.back();
    }
  }

  /**
   * Native back button click presents own challenge as we don't have to worry about preserving
   * history state but we do need to worry about minimizing and for some reason location back
   * method inconsistent (so use manual history)
   */
  private async handleNativeBack() {
    const currentPath = this.location.path();
    if (currentPath === '') {
      return CapacitorApp.minimizeApp();
    }
    if (this.history.length <= 1) {
      return this.router.navigate(['/'], {
        replaceUrl: true,
      });
    } else {
      try {
        const current = this.history.pop();
        const previous = this.history.pop();
        // HACK - ensure queryParams extracted correctly
        const { pathname, params } = extractSearchParams(previous);
        this.router.navigate([pathname || '/'], { replaceUrl: true, queryParams: params });
      } catch (error) {
        console.error(error);
        return this.router.navigate(['/'], {
          replaceUrl: true,
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
    CapacitorApp.removeAllListeners();
  }
}

function extractSearchParams(path = '/') {
  const params: Record<string, string> = {};
  // HACK - use template host as android will have invalid scheme
  const url = new URL(`http://example.com${path}`);
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return { pathname: url.pathname, params };
}
