import { Component, effect, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { debounce, filter, interval, Subject, takeUntil } from 'rxjs';

import { IBreadcrumbOptions, PicsaCommonComponentsService } from '../services/components.service';

@Component({
  selector: 'picsa-breadcrumbs',
  template: `
    <div class="breadcrumbs-container" *ngIf="options.enabled && breadcrumbs.length > 2">
      <div *ngFor="let breadcrumb of breadcrumbs; last as isLast">
        <button mat-button [routerLink]="breadcrumb.path">
          {{ breadcrumb.label }}
        </button>
        <mat-icon *ngIf="!isLast" style="line-height:36px">chevron_right</mat-icon>
      </div>
    </div>
  `,
  styles: [
    `
      .breadcrumbs-container {
        padding: 0 1rem;
        display: flex;
        flex-wrap: wrap;
      }
    `,
  ],
})
export class PicsaBreadcrumbsComponent implements OnInit, OnDestroy {
  public breadcrumbs: { label: string; path: string }[] = [];
  private aliases: Map<string, string>;
  public options: IBreadcrumbOptions = { hideOnPaths: {}, enabled: false };
  private destroyed$ = new Subject<boolean>();
  private rebuild$ = new Subject<boolean>();
  constructor(private componentsService: PicsaCommonComponentsService, private router: Router) {
    effect(() => {
      const headerOptions = this.componentsService.headerOptions();
      const title = headerOptions.title;
      if (title) {
        if (this.getAlias(location.pathname) !== title) {
          this.setAlias(location.pathname, title);
          this.rebuild$.next(true);
        }
      }
    });
  }

  ngOnInit() {
    this.constructBreadcrumbAliases();
    this.listenToServiceChanges();
    this.listenToRouteChanges();
    // Debounce to prevent too frequent breadcrumb updates
    this.rebuild$
      .pipe(
        takeUntil(this.destroyed$),
        debounce(() => interval(50))
      )
      .subscribe(() => this.constructBreadcrumbs());
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
        filter((event) => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.rebuild$.next(true);
      });
  }
  /** Listen to changes to title triggered directly service */
  private listenToServiceChanges() {
    this.componentsService.breadcrumbOptions$.pipe(takeUntil(this.destroyed$)).subscribe((options) => {
      this.options = options;
      //
    });
  }
  /********************************************************************************
   * Breadcrumbs
   *******************************************************************************/
  /** Retrieve any aliases defined in top-level config for use on reload */
  private constructBreadcrumbAliases() {
    this.aliases = new Map();
    for (const config of this.router.config) {
      if (typeof config.path === 'string') {
        this.setAlias(config.path, config.title?.toString() ?? config.path);
      }
    }
  }
  private setAlias(path: string, alias: string) {
    if (!path.startsWith('/')) path = `/${path}`;
    this.aliases.set(path, alias);
  }
  private getAlias(path: string) {
    if (!path.startsWith('/')) path = `/${path}`;
    return this.aliases.get(path);
  }

  private constructBreadcrumbs() {
    const segments = location.pathname.split('/').filter((s) => !!s);
    this.breadcrumbs = segments
      .map((segment, i) => {
        let path = segments.slice(0, i + 1).join('/');
        if (!path.startsWith('/')) path = `/${path}`;
        const label = this.getAlias(path) || segment;
        return { label, path };
      })
      .filter((b) => {
        return !this.options.hideOnPaths?.[b.path];
      });
    this.breadcrumbs.unshift({ path: '/', label: this.getAlias('/') || '/' });
  }
}
