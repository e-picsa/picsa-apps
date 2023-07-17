import { Location } from '@angular/common';
import { Component, NgZone, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Subject, takeUntil } from 'rxjs';

import { PicsaCommonComponentsService } from '../services/components.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'back-button',
  template: `
    <button *ngIf="showButton" mat-button (click)="back()" color="white"><mat-icon>arrow_back</mat-icon>Back</button>
  `,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class BackButton implements OnDestroy {
  showButton = false;
  private componentDestroyed$ = new Subject<boolean>();

  constructor(
    private router: Router,
    private location: Location,
    private zone: NgZone,
    private componentService: PicsaCommonComponentsService
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

  private checkButtonState(url: string) {
    this.showButton = url !== '/';
  }

  private subscribeToRouteChanges() {
    this.router.events.pipe(takeUntil(this.componentDestroyed$)).subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.history.push(e.urlAfterRedirects);
        this.checkButtonState(e.urlAfterRedirects);
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
        this.router.navigate([previous], { replaceUrl: true });
      } catch (error) {
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
