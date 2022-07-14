import { Component, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'back-button',
  template: `
    <button *ngIf="showButton" mat-button (click)="back()">
      <mat-icon>arrow_back</mat-icon>Back
    </button>
  `,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class BackButton implements OnDestroy {
  showButton = false;
  /** Track list of page views for back navigation */
  private history: string[] = [];
  private componentDestroyed$ = new Subject<boolean>();

  constructor(private router: Router, private location: Location) {
    this.subscribeToRouteChanges();
  }

  checkButtonState(url: string) {
    this.showButton = url !== '/';
  }

  private subscribeToRouteChanges() {
    this.router.events
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((e) => {
        if (e instanceof NavigationEnd) {
          this.history.push(e.urlAfterRedirects);
          this.checkButtonState(e.urlAfterRedirects);
        }
      });
  }

  /**
   * Handle back navigation. Prefer to use history location back, however if initial nav
   * just navigate to home page. Adapated from:
   * https://nils-mehlhorn.de/posts/angular-navigate-back-previous-page
   *
   * TODO - complex routing requirements could likely be solved more easily when nav Api supported
   * https://caniuse.com/mdn-api_navigation
   */
  back() {
    if (this.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/'], {
        replaceUrl: true,
      });
    }
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }
}
