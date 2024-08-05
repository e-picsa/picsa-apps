import { MediaMatcher } from '@angular/cdk/layout';
import { DomPortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  input,
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
 *  <div desktopHeader>This will appear in desktop header</div>
 *  <div mobileHeader>This will appear in mobile sidenav header</div>
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
    <div #headerContent [style.display]="headerAttached ? 'contents' : 'none'">
      <!-- desktop-only header -->
      <div [style.display]="mobileQuery.matches ? 'none' : 'contents'">
        <ng-content select="[desktopHeader]"></ng-content>
      </div>
      <!-- default buttons -->
      <button mat-button color="primary" #optionsToggleButton (click)="snav.toggle()">
        <span style="margin-right: 8px">
          <span>{{ 'Options' | translate }}</span>
        </span>
        <mat-icon iconPositionEnd>menu</mat-icon>
      </button>
    </div>

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
})
export class PicsaSidenavComponent implements OnInit, AfterViewInit {
  private _mobileQueryListener: () => void;
  public mobileQuery: MediaQueryList;

  public headerAttached = false;

  /** Specify whether should be initially opened */
  initialOpen = input<boolean>();

  public opened = signal(this.initialOpen() ? true : false);

  @ViewChild('headerContent') headerContent: ElementRef<HTMLElement>;
  @ViewChild(MatSidenav) matSidenav: MatSidenav;

  constructor(
    private componentsService: PicsaCommonComponentsService,
    private media: MediaMatcher,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscribeToLayoutChanges();
  }
  ngAfterViewInit() {
    setTimeout(() => {
      const endContent = new DomPortal(this.headerContent);
      this.componentsService.patchHeader({ endContent });
      this.headerAttached = true;
    }, 50);
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
