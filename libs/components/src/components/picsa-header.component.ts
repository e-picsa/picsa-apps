import { Component, computed, effect, inject,OnDestroy, OnInit, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  ActivatedRouteSnapshot,
  DefaultTitleStrategy,
  NavigationEnd,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { filter, map, Subject, takeUntil } from 'rxjs';

import { IHeaderOptions, PicsaCommonComponentsService } from '../services/components.service';

@Component({
  selector: 'picsa-header',
  template: `
    <header [attr.data-style]="style" [style.display]="hideHeader() ? 'none' : 'flex'">
      <div class="start-content">
        <!-- HACK - menu button passed as portal but back-button hardcoded -->
        <back-button
          [style.display]="hideBackButton() ? 'none' : 'block'"
          [variant]="style === 'primary' ? 'white' : 'primary'"
        ></back-button>
        <ng-template [cdkPortalOutlet]="cdkPortalStart" #portalOutlet></ng-template>
      </div>
      <h1 class="central-content">
        <ng-template [cdkPortalOutlet]="cdkPortalCenter" #portalOutlet></ng-template>
        @if (!cdkPortalCenter) {
          <span class="title">{{ title | translate }}</span>
        }
      </h1>
      <div class="end-content">
        <!-- sidenav toggle -->
        @if (showSidenavToggle()) {
          <button mat-icon-button (click)="componentsService.toggleSidenav()">
            <mat-icon>menu</mat-icon>
          </button>
        }
      </div>
    </header>
    <picsa-breadcrumbs> </picsa-breadcrumbs>
  `,
  styleUrls: ['./picsa-header.component.scss'],
  standalone: false,
})
export class PicsaHeaderComponent implements OnInit, OnDestroy {
  componentsService = inject(PicsaCommonComponentsService);
  private router = inject(Router);
  private titleStrategy = inject(DefaultTitleStrategy);
  private titleService = inject(Title);

  public title = '';
  public style: 'primary' | 'inverted' = 'primary';
  public hideBackButton = signal(false);
  public hideHeader = signal(false);

  private destroyed$ = new Subject<boolean>();
  /** Inject dynamic content into header slots using angular cdk portal */
  public cdkPortalStart: IHeaderOptions['cdkPortalStart'];
  public cdkPortalCenter: IHeaderOptions['cdkPortalCenter'];

  public showSidenavToggle = computed(() => this.componentsService.headerOptions().showSidenavToggle);

  constructor() {
    effect(() => {
      const headerOptions = this.componentsService.headerOptions();
      this.handleHeaderOptionsChange(headerOptions);
    });
  }

  ngOnInit() {
    this.listenToRouteChanges();
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

  /**
   * Subscribe to route changes. On navigation end iterate through all
   * nested angular routers to check for any that populate data params
   * for the header title and style
   *
   * NOTE - this code is adapated from angular's in-built methods for
   * providing a custom title
   * https://github.dev/angular/angular/blob/main/packages/router/src/router_module.ts
   * https://dev.to/brandontroberts/setting-page-titles-natively-with-the-angular-router-393j
   *
   */
  private listenToRouteChanges() {
    this.router.events
      .pipe(
        takeUntil(this.destroyed$),
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          // if no options specified title will continue from previous, header will revert
          let title = '';
          let headerStyle = 'primary';
          const snapshot: RouterStateSnapshot = this.router.routerState.snapshot;
          let route: ActivatedRouteSnapshot | undefined = snapshot.root;
          while (route !== undefined) {
            title = this.titleStrategy.getResolvedTitleForRoute(route) ?? title;
            headerStyle = route.data['headerStyle'] ?? headerStyle;
            route = route.children.find((child) => child.outlet === 'primary');
          }
          return { title, headerStyle };
        }),
      )
      .subscribe(({ title, headerStyle }) => {
        this.componentsService.patchHeader({
          style: headerStyle as any,
          title,
        });
      });
  }

  private handleHeaderOptionsChange(options: IHeaderOptions) {
    const { title, style, hideBackButton, hideHeader } = options;
    requestAnimationFrame(() => {
      if (title && this.title !== title) {
        this.title = title;
        this.titleService.setTitle(title);
      }
      if (style) {
        this.style = style;
      }
      this.setPortalContent(options);
      // hide back button when set or if on farmer or extension homepages
      const shouldHideBackButton = hideBackButton || ['/', '/farmer', '/extension'].includes(location.pathname);
      this.hideBackButton.set(shouldHideBackButton);
      this.hideHeader.set(hideHeader ? true : false);
    });
  }

  private setPortalContent(options: IHeaderOptions) {
    const { cdkPortalStart, cdkPortalCenter } = options;
    // Center Portal
    if (!cdkPortalStart) {
      this.cdkPortalStart = undefined;
    }
    if (!cdkPortalStart?.isAttached) {
      this.cdkPortalStart = cdkPortalStart;
    }
    // Center Portal
    if (!cdkPortalCenter) {
      this.cdkPortalCenter = undefined;
    }
    if (!cdkPortalCenter?.isAttached) {
      this.cdkPortalCenter = cdkPortalCenter;
    }
  }
}
