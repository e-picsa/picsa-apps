import { Directive, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';

/**
 * Preserves scroll position on back/forward nav and scrolls to top on forward nav.
 *
 * Host element must be the scroll container. Disable Angular's built-in
 * restoration via `withInMemoryScrolling({ scrollPositionRestoration: 'disabled' })`.
 *
 * @example
 * ```html
 * <div class="page" scrollRestore>
 *   <router-outlet />
 * </div>
 * ```
 */
@Directive({
  selector: '[scrollRestore]',
})
export class PicsaScrollRestoreDirective implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);

  private readonly positions = new Map<string, number>();
  private currentUrl = this.router.url;
  private restoreTo: number | null = null;
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.router.events
      .pipe(filter((e) => e instanceof NavigationStart || e instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          // Save scroll position of the page we're leaving
          this.positions.set(this.currentUrl, this.el.nativeElement.scrollTop);

          // Decide where to scroll once nav completes
          const trigger = this.router.currentNavigation()?.trigger;
          this.restoreTo = trigger === 'popstate' ? (this.positions.get(event.url) ?? 0) : 0;
        } else if (event instanceof NavigationEnd) {
          this.currentUrl = event.urlAfterRedirects;
          const top = this.restoreTo ?? 0;
          this.restoreTo = null;

          requestAnimationFrame(() => {
            this.el.nativeElement.scrollTo({ top, behavior: 'auto' });
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
