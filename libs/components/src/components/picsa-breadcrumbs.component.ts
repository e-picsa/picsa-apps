import { ChangeDetectionStrategy, Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { debounce, filter, interval, Subject, takeUntil } from 'rxjs';

import { IBreadcrumbOptions, PicsaCommonComponentsService } from '../services/components.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'picsa-breadcrumbs',
  template: `
    @if (options()?.enabled && breadcrumbs().length > 2) {
      <div class="breadcrumbs-container">
        @for (breadcrumb of breadcrumbs(); track breadcrumb.path; let isLast = $last) {
          <div>
            <button matButton [routerLink]="breadcrumb.path">
              {{ breadcrumb.label }}
            </button>
            @if (!isLast) {
              <mat-icon style="line-height:36px">chevron_right</mat-icon>
            }
          </div>
        }
      </div>
    }
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
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterModule],
})
export class PicsaBreadcrumbsComponent implements OnInit, OnDestroy {
  private componentsService = inject(PicsaCommonComponentsService);
  private router = inject(Router);

  public breadcrumbs = signal<{ label: string; path: string }[]>([]);
  private aliases: Map<string, string>;
  public options = toSignal(this.componentsService.breadcrumbOptions$, {
    initialValue: { hideOnPaths: {}, enabled: false } as IBreadcrumbOptions,
  });
  private destroyed$ = new Subject<boolean>();
  private rebuild$ = new Subject<boolean>();
  constructor() {
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
    this.listenToRouteChanges();
    // Debounce to prevent too frequent breadcrumb updates
    this.rebuild$
      .pipe(
        takeUntil(this.destroyed$),
        debounce(() => interval(50)),
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
        filter((event) => event instanceof NavigationEnd),
      )
      .subscribe(() => {
        this.rebuild$.next(true);
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
    const breadcrumbs = segments
      .map((segment, i) => {
        let path = segments.slice(0, i + 1).join('/');
        if (!path.startsWith('/')) path = `/${path}`;
        const label = this.getAlias(path) || segment;
        return { label, path };
      })
      .filter((b) => {
        return !this.options()?.hideOnPaths?.[b.path];
      });
    breadcrumbs.unshift({ path: '/', label: this.getAlias('/') || '/' });
    this.breadcrumbs.set(breadcrumbs);
  }
}
