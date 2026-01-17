import { MediaMatcher } from '@angular/cdk/layout';
import {
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

import { PicsaCommonComponentsService } from '../services/components.service';

/**
 * Render a page layout with sidenav and various ng-content placeholders
 * Responsive to render alongside content on desktop and over on mobile
 * @example
 * ```
 * <picsa-sidenav-layout>
 *  <div sidenav>This will appear in sidenav</div>
 *  <div content>This will appear in main content</div>
 * </picsa-sidename-layout>
 * ```
 *
 * TODO - could be refactored to inject directly into app container instead of page
 */
@Component({
  selector: 'picsa-sidenav-layout',
  template: `
    <mat-sidenav-container style="flex: 1" [style.marginTop.px]="mobileQuery.matches ? 56 : 0">
      <mat-sidenav
        #snav
        [mode]="mobileQuery.matches ? 'over' : 'side'"
        [fixedInViewport]="mobileQuery.matches"
        position="end"
        style="width: 300px"
        [opened]="opened()"
        [fixedTopGap]="0"
        (openedChange)="handleSidenavChange(snav.opened)"
        (swipeRight)="snav.toggle()"
      >
        <!-- Sidenav Content -->
        <div class="sidenav-container" [attr.data-mobile]="mobileQuery.matches">
          <!-- Mobile-only  -->
          <div class="sidenav-mobile-header" [style.display]="mobileQuery.matches ? 'flex' : 'none'">
            <button mat-icon-button color="primary" (click)="snav.toggle()">
              <mat-icon>close</mat-icon>
            </button>
            <ng-content select="[mobileHeader]"></ng-content>
          </div>
          <!-- Desktop and Mobile  -->
          <div class="sidenav-content">
            <ng-content select="[sidenav]" style="flex:1"></ng-content>
          </div>
        </div>
      </mat-sidenav>

      <!-- Main page content -->
      <mat-sidenav-content style="display:flex">
        <div class="page-content">
          <ng-content select="[content]"></ng-content>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .sidenav-container,
      .sidenav-content,
      .sidenav-content > * {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      .sidenav-container {
        height: calc(100% - 16px);
        padding-left: 1rem;
        &[data-mobile='true'] {
          padding-right: 1rem;
        }
      }

      .sidenav-mobile-header {
        width: 100%;
        justify-content: space-between;
        align-items: center;
      }

      mat-sidenav-content.page-content {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 120px);
        overflow: auto;
      }
      mat-sidenav-container {
        margin-top: 0 !important;
      }
    `,
  ],
  standalone: false,
})
export class PicsaSidenavComponent implements OnInit, OnDestroy {
  componentsService = inject(PicsaCommonComponentsService);
  private media = inject(MediaMatcher);
  private cdr = inject(ChangeDetectorRef);

  private _mobileQueryListener: () => void;
  public mobileQuery: MediaQueryList;

  public headerAttached = false;

  public hideHeader = input(false);

  /** Specify whether should be initially opened */
  initialOpen = input<boolean>();

  public opened = signal(this.initialOpen() ? true : false);

  public showSidenavToggle = computed(() => this.componentsService.headerOptions().showSidenavToggle);

  @ViewChild(MatSidenav) matSidenav: MatSidenav;

  ngOnInit() {
    this.componentsService.registerSidenav(this);
    this.componentsService.patchHeader({ showSidenavToggle: true });
    this.subscribeToLayoutChanges();
  }

  ngOnDestroy(): void {
    this.componentsService.patchHeader({ showSidenavToggle: false });
  }

  public toggle() {
    this.matSidenav.toggle();
  }

  /** Public method to trigger sidebar close from child content */
  public close() {
    this.matSidenav.close();
  }

  /** Use media queries to handle sidenav */
  private subscribeToLayoutChanges() {
    this.mobileQuery = this.media.matchMedia('(max-width: 768px)');
    this._mobileQueryListener = () => this.cdr.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  /** when toggling sidebar also trigger resize event to ensure chart resizes */
  public handleSidenavChange(opened: boolean) {
    this.opened.set(opened);
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }
}
