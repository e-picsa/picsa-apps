import { MediaMatcher } from '@angular/cdk/layout';
import { DomPortal } from '@angular/cdk/portal';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

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
          <span *ngIf="snav.opened">{{ 'Hide Options' | translate }}</span>
          <span *ngIf="!snav.opened">{{ 'Show Options' | translate }}</span>
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
        [opened]="opened"
        [fixedTopGap]="0"
        (openedChange)="handleSidenavChange()"
        (swipeRight)="snav.toggle()"
      >
        <div class="sidenav-header" [style.display]="mobileQuery.matches ? 'flex' : 'none'">
          <button mat-icon-button color="primary" (click)="snav.toggle()">
            <mat-icon>close</mat-icon>
          </button>
          <ng-content select="[mobileHeader]"></ng-content>
          <!-- <button mat-button color="primary" (click)="showShareDialog()">
            <mat-icon>share</mat-icon>{{ 'Share' | translate }}
          </button> -->
        </div>
        <ng-content select="[sidenav]"></ng-content>
      </mat-sidenav>
      <mat-sidenav-content>
        <div class="page-content" style="height: calc(100vh - 120px); overflow: auto">
          <ng-content select="[content]"></ng-content>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .sidenav-header {
        width: 100%;
        justify-content: space-between;
        align-items: center;
      }

      mat-sidenav-content.page-content {
        display: flex;
        flex-direction: column;
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

  @Input() opened = true;

  @ViewChild('headerContent') headerContent: ElementRef<HTMLElement>;

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

  /** Use media queries to handle sidenav */
  private subscribeToLayoutChanges() {
    this.mobileQuery = this.media.matchMedia('(max-width: 768px)');
    this._mobileQueryListener = () => this.cdr.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  /** when toggling sidebar also trigger resize event to ensure chart resizes */
  public handleSidenavChange() {
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }
}
