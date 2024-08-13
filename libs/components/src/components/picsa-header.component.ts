import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
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
    <header [attr.data-style]="style">
      <div class="start-content">
        <!-- HACK - menu button passed as content but back-button hardcoded -->
        <ng-content></ng-content>
        <back-button
          [style.display]="hideBackButton ? 'none' : 'block'"
          [variant]="style === 'primary' ? 'white' : 'primary'"
        ></back-button>
      </div>
      <h1 class="central-content">
        <ng-template [cdkPortalOutlet]="cdkPortalCenter" #portalOutlet></ng-template>
        @if(!cdkPortalCenter){
        <span class="title">{{ title | translate }}</span>
        }
      </h1>
      <div class="end-content">
        <ng-template [cdkPortalOutlet]="cdkPortalEnd" #portalOutlet></ng-template>
      </div>
    </header>
    <picsa-breadcrumbs> </picsa-breadcrumbs>
  `,
  styleUrls: ['./picsa-header.component.scss'],
})
export class PicsaHeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  public title = '';
  public style: 'primary' | 'inverted' = 'primary';
  public hideBackButton? = false;

  private destroyed$ = new Subject<boolean>();
  /** Inject dynamic content into header slots using angular cdk portal */
  public cdkPortalCenter: IHeaderOptions['cdkPortalCenter'];
  public cdkPortalEnd: IHeaderOptions['cdkPortalEnd'];

  constructor(
    private componentsService: PicsaCommonComponentsService,
    private router: Router,
    private titleStrategy: DefaultTitleStrategy,
    private titleService: Title
  ) {}

  ngOnInit() {
    this.listenToRouteChanges();
  }
  ngAfterViewInit(): void {
    this.listenToServiceOptionChanges();
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
        })
      )
      .subscribe(({ title, headerStyle }) => {
        this.componentsService.patchHeader({
          style: headerStyle as any,
          title,
        });
      });
  }

  /** Listen to changes to title triggered directly service */
  private listenToServiceOptionChanges() {
    this.componentsService.headerOptions$.pipe(takeUntil(this.destroyed$)).subscribe((options) => {
      const { title, style, hideBackButton } = options;
      requestAnimationFrame(() => {
        if (title) {
          this.title = title;
          this.titleService.setTitle(title);
        }
        if (style) {
          this.style = style;
        }
        this.setPortalContent(options);
        // hide back button when set or if on farmer or extension homepages
        this.hideBackButton = hideBackButton || ['/', '/farmer', '/extension'].includes(location.pathname);
      });
    });
  }
  private setPortalContent(options: IHeaderOptions) {
    const { cdkPortalCenter, cdkPortalEnd } = options;
    // Center Portal
    if (!cdkPortalCenter) {
      this.cdkPortalCenter = undefined;
    }
    if (!cdkPortalCenter?.isAttached) {
      this.cdkPortalCenter = cdkPortalCenter;
    }
    // End Portal
    if (!cdkPortalEnd) {
      this.cdkPortalEnd = undefined;
    }
    if (!cdkPortalEnd?.isAttached) {
      this.cdkPortalEnd = cdkPortalEnd;
    }
  }
}
