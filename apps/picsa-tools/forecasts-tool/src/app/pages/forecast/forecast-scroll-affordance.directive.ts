import { computed, Directive, ElementRef, inject, OnDestroy, OnInit, signal } from '@angular/core';

/** Scroll metrics required to derive scroll affordance state */
export interface IScrollAffordanceMetrics {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}

/**
 * Derives whether more content is available off-screen in either direction.
 * Pure helper kept separate from the directive for deterministic unit testing.
 */
export function getScrollAffordanceState(metrics: IScrollAffordanceMetrics): { before: boolean; after: boolean } {
  const { scrollLeft, scrollWidth, clientWidth } = metrics;
  if (scrollWidth <= clientWidth + 1) return { before: false, after: false };
  return { before: scrollLeft > 4, after: scrollLeft + clientWidth < scrollWidth - 4 };
}

/**
 * Derives the active progress dot from the scroll position, mapping scroll
 * progress across [0, maxScroll] onto dot indexes [0, count - 1]. This
 * guarantees the first dot highlights at rest and the last dot highlights at
 * the end, which a per-card step division cannot (max scroll is rarely an
 * exact multiple of the card step, stranding the final dot).
 * Pure helper kept separate from the directive for deterministic unit testing.
 */
export function getActiveCardIndex(scrollLeft: number, maxScroll: number, count: number): number {
  if (count <= 0 || maxScroll <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round((scrollLeft / maxScroll) * (count - 1))));
}

/**
 * Adds subtle scroll affordances to a horizontal forecast card list:
 * - Exposes `canScrollBefore` / `canScrollAfter` signals so the template can
 *   show tappable edge bars only while more content is available off-screen
 *   in that direction.
 * - Exposes `showDots`, `dotIndexes` and `activeIndex` signals so the template
 *   can render a subtle dot progress strip, shown only while the list overflows.
 *   Affordances are template-rendered (not directive-created DOM) so
 *   component-scoped styles apply to them in every host app.
 * Renders nothing when all content fits.
 *
 * @example
 * ```html
 * <div class="forecast-scroll-wrap">
 *   <div class="flex overflow-x-auto forecast-scroll" forecastScrollAffordance #scroller="forecastScrollAffordance">
 *     ...
 *   </div>
 *   <button matButton class="forecast-scroll-bar is-after" [class.is-visible]="scroller.canScrollAfter()"
 *     (click)="scroller.scrollStep('after')">
 *     <mat-icon>chevron_right</mat-icon>
 *   </button>
 * </div>
 * ```
 */
@Directive({
  selector: '[forecastScrollAffordance]',
  exportAs: 'forecastScrollAffordance',
})
export class ForecastScrollAffordanceDirective implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private rafId = 0;

  /** Whether the list currently overflows its visible width */
  public readonly hasOverflow = signal(false);

  /** Whether more content is available off-screen before/after the viewport */
  public readonly canScrollBefore = signal(false);
  public readonly canScrollAfter = signal(false);

  /** Number of rendered cards */
  public readonly cardCount = signal(0);

  /** Index of the leftmost visible card */
  public readonly activeIndex = signal(0);

  /** Whether the dot progress strip should be shown */
  public readonly showDots = computed(() => this.hasOverflow() && this.cardCount() > 1);

  /** One index per card, for rendering progress dots */
  public readonly dotIndexes = computed(() => Array.from({ length: this.cardCount() }, (_, i) => i));

  /** Shared handler for scroll and window resize events */
  private readonly handleChange = () => this.scheduleUpdate();

  /** Scrolls by one card in the given direction */
  public scrollStep(direction: 'before' | 'after'): void {
    const target = this.el.nativeElement;
    const step = this.getCardStep(target);
    if (step > 0) {
      target.scrollBy({ left: direction === 'after' ? step : -step, behavior: 'smooth' });
    }
  }

  ngOnInit(): void {
    const target = this.el.nativeElement;
    target.addEventListener('scroll', this.handleChange, { passive: true });
    window.addEventListener('resize', this.handleChange);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.scheduleUpdate());
      this.resizeObserver.observe(target);
    }
    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => {
        this.syncCount(target);
        this.scheduleUpdate();
      });
      this.mutationObserver.observe(target, { childList: true });
    }
    this.syncCount(target);
    this.update();
  }

  ngOnDestroy(): void {
    const target = this.el.nativeElement;
    target.removeEventListener('scroll', this.handleChange);
    window.removeEventListener('resize', this.handleChange);
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  private scheduleUpdate() {
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => this.update());
  }

  private update() {
    const target = this.el.nativeElement;
    const { scrollWidth, clientWidth } = target;
    const overflow = scrollWidth > clientWidth + 1;
    this.hasOverflow.set(overflow);
    const { before, after } = getScrollAffordanceState(target);
    this.canScrollBefore.set(before);
    this.canScrollAfter.set(after);
    const count = target.children.length;
    const step = this.getCardStep(target);
    this.activeIndex.set(
      overflow && count > 1 && step > 0
        ? getActiveCardIndex(target.scrollLeft, target.scrollWidth - target.clientWidth, count)
        : 0,
    );
  }

  private syncCount(target: HTMLElement) {
    this.cardCount.set(target.children.length);
  }

  private getCardStep(target: HTMLElement): number {
    const first = target.children.item(0);
    if (!first) return 0;
    const gap = Number.parseFloat(getComputedStyle(target).columnGap) || 0;
    return first.getBoundingClientRect().width + gap;
  }
}
