import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Directive, ElementRef, inject, input, OnInit, output, PLATFORM_ID } from '@angular/core';

/**
 * A highly optimized, Zoneless-compatible directive for handling mobile-first
 * touch gestures (tap and long-press) while gracefully falling back to desktop
 * mouse and keyboard interactions.
 *
 * Features:
 *
 * - **SSR Safe:** Safely bypasses execution on the server.
 * - **Zoneless Ready:** Uses native DOM events to prevent unnecessary change detection cycles.
 * - **Drift Protection:** Cancels the long-press if the user's finger wiggles or swipes (>15px).
 * - **A11y Compliant:** Supports 'Enter' and 'Space' keystrokes for screen readers and keyboard navigation.
 * - **Conflict Resolution:** Violently intercepts and kills native DOM `click` events to prevent double-firing.
 *
 * @example
 * ```html
 * <button mat-flat-button picsaTouchGestures (tap)="deleteItem()" (longPress)="openAdvancedMenu()">Action</button>
 *
 * <div picsaTouchGestures [touchThreshold]="750" [touchTolerance]="30" (longPress)="showTooltip()">Hold for info</div>
 * ```
 */
@Directive({
  selector: '[picsaTouchGestures]',
  standalone: true,
  host: {
    // Merge tailwind classes onto host element to prevent text highlight
    // and native os popup menus
    class: 'select-none touch-manipulation [-webkit-touch-callout:none]',
  },
})
export class PicsaTouchGesturesDirective implements OnInit {
  /**
   * The duration in milliseconds the user must hold the element to trigger a long press.
   * @default 500
   */
  touchThreshold = input<number>(500);

  /**
   * The number of pixels touch can move and still register long-press
   * @default 15
   */
  touchTolerance = input<number>(15);

  /** Emitted when the user quickly taps, clicks, or presses Enter/Space.
   * Exclusively replaces the native `(click)` event.
   */
  tap = output<PointerEvent | KeyboardEvent>();

  /** Emitted when the user holds the element for the duration of the threshold. */
  longPress = output<PointerEvent>();

  private el = inject(ElementRef);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  private timeoutId?: ReturnType<typeof setTimeout>;
  private isLongPressing = false;

  private startX = 0;
  private startY = 0;

  ngOnInit() {
    // Abort if rendering on the server (Angular Universal / SSR)
    if (!isPlatformBrowser(this.platformId)) return;

    const element = this.el.nativeElement as HTMLElement;

    const onCancel = () => this.clearTimer();
    const onContextMenu = (e: Event) => e.preventDefault();

    // Attach native listeners outside of Angular's knowledge
    element.addEventListener('pointerdown', this.handlePointerDown);
    element.addEventListener('pointermove', this.handlePointerMove);
    element.addEventListener('pointerup', this.handlePointerUp);
    element.addEventListener('pointercancel', onCancel);
    element.addEventListener('pointerleave', onCancel);
    element.addEventListener('contextmenu', onContextMenu);

    // Use capture phase to intercept the click before it bubbles to Angular
    element.addEventListener('click', this.handleNativeClick, { capture: true });
    element.addEventListener('keydown', this.handleKeyDown);

    // Cleanup memory when the directive is destroyed
    this.destroyRef.onDestroy(() => {
      element.removeEventListener('pointerdown', this.handlePointerDown);
      element.removeEventListener('pointermove', this.handlePointerMove);
      element.removeEventListener('pointerup', this.handlePointerUp);
      element.removeEventListener('pointercancel', onCancel);
      element.removeEventListener('pointerleave', onCancel);
      element.removeEventListener('contextmenu', onContextMenu);
      element.removeEventListener('click', this.handleNativeClick, { capture: true });
      element.removeEventListener('keydown', this.handleKeyDown);
      this.clearTimer();
    });
  }

  // --- ACCESSIBILITY (A11Y) ---
  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevents page scroll on Space
      this.tap.emit(event);
    }
  }

  // --- NATIVE INTERCEPTION ---
  private handleNativeClick = (event: MouseEvent) => {
    // Prevent all native click interaction
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  // --- POINTER LOGIC ---
  private handlePointerDown = (event: PointerEvent) => {
    // Ignore right-clicks on desktop
    if (event.button !== 0 && event.pointerType === 'mouse') return;

    this.startX = event.clientX;
    this.startY = event.clientY;
    this.isLongPressing = false;

    this.timeoutId = setTimeout(() => {
      this.isLongPressing = true;

      // Trigger native device vibration in supported webviews (mostly Android)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      this.longPress.emit(event);
    }, this.touchThreshold());
  };

  private handlePointerMove = (event: PointerEvent) => {
    // If timer isn't running, ignore movement
    if (!this.timeoutId) return;

    const deltaX = Math.abs(event.clientX - this.startX);
    const deltaY = Math.abs(event.clientY - this.startY);

    // Cancel the hold if the user dragged their finger too far
    if (deltaX > this.touchTolerance() || deltaY > this.touchTolerance()) {
      this.clearTimer();
    }
  };

  private handlePointerUp = (event: PointerEvent) => {
    const wasLongPressing = this.isLongPressing;
    this.clearTimer();

    // Only fire the tap event if the threshold wasn't reached
    if (!wasLongPressing) {
      this.tap.emit(event);
    }
  };

  private clearTimer = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  };
}
