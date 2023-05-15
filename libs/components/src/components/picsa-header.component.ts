import { Portal } from '@angular/cdk/portal';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  ActivatedRouteSnapshot,
  DefaultTitleStrategy,
  NavigationEnd,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { filter, map, Subject, takeUntil } from 'rxjs';

import { PicsaCommonComponentsService } from '../services/components.service';

@Component({
  selector: 'picsa-header',
  template: `
    <header [attr.data-style]="style">
      <div class="start-content">
        <back-button [style.visibility]="hideBackButton ? 'hidden' : 'visible'"></back-button>
      </div>
      <h1 class="central-content">
        <span>{{ title | translate }}</span>
      </h1>
      <div class="end-content">
        <ng-template [cdkPortalOutlet]="endPortal"></ng-template>
      </div>
    </header>
    <picsa-breadcrumbs> </picsa-breadcrumbs>
  `,
  styleUrls: ['./picsa-header.component.scss'],
})
export class PicsaHeaderComponent implements OnInit, OnDestroy {
  public title = '';
  public style: 'primary' | 'inverted' = 'primary';
  public hideBackButton? = false;

  private destroyed$ = new Subject<boolean>();
  /** Inject dynamic content into end slot of header using angular cdk portal */
  public endPortal?: Portal<any>;
  constructor(
    private componentsService: PicsaCommonComponentsService,
    private router: Router,
    private titleStrategy: DefaultTitleStrategy,
    private titleService: Title
  ) {}

  ngOnInit() {
    this.listenToServiceTitleChanges();
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
  private listenToServiceTitleChanges() {
    this.componentsService.headerOptions$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ title, style, endContent, hideBackButton }) => {
        requestAnimationFrame(() => {
          if (title) {
            this.title = title;
            this.titleService.setTitle(title);
          }
          if (style) {
            this.style = style;
          }
          this.hideBackButton = hideBackButton;
          this.endPortal = endContent;
        });
      });
  }
}
