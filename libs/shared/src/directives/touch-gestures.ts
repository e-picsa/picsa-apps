import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Directive, ElementRef, inject, input, OnInit, output, PLATFORM_ID } from '@angular/core';

type EventBinding<K extends keyof HTMLElementEventMap> = [
  K,
  (e: HTMLElementEventMap[K]) => void,
  AddEventListenerOptions?,
];

/** Utility function to allow event bindings to be defined in type-safe array */
function eventBinding<K extends keyof HTMLElementEventMap>(...args: EventBinding<K>): EventBinding<K> {
  return args;
}

/**
 * A highly optimized, Zoneless-compatible directive for handling mobile-first
 * touch gestures (tap and long-press) while gracefully falling back to desktop
 * mouse and keyboard interactions.
 *
 * Features:
 *
 * - **SSR Safe:** Safely bypasses execution on the server.
 * - **Zoneless Ready:** Uses native DOM events to prevent unnecessary change detection cycles.
 * - **Drift Protection:** Cancels the long-press if the user's finger wiggles or swipes beyond tolerance.
 * - **Conflict Resolution:** Intercepts native DOM `click` events after a long press to prevent double-firing.
 *   Native `click` events are allowed through for standard taps so that `routerLink`, form submissions,
 *   and parent `(click)` bindings continue to work.
 *
 * **A11y Note:** This directive does not add `role` or `tabindex` automatically.
 * If applied to a non-interactive element (e.g. `<div>`), the consumer is responsible for ensuring the host
 * is focusable and has an appropriate ARIA role.
 * For grids, consider using `role="grid"` with `role="gridcell"` children and roving tabindex instead.
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

  /**
   * Emitted when the user quickly taps, clicks, or presses Enter/Space.
   * Exclusively replaces the native `(click)` event.
   */
  tap = output<PointerEvent | KeyboardEvent>();

  /**
   * Emitted when the user holds the element for the duration of the threshold.
   * Note: The emitted event is the originating `pointerdown` event, not a live event
   * at the moment the threshold was reached.
   */
  longPress = output<PointerEvent>();

  private el = inject(ElementRef);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  private timeoutId?: ReturnType<typeof setTimeout>;
  private isLongPressing = false;
  private suppressNextClick = false;

  private startX = 0;
  private startY = 0;

  /** Tracks the active pointer to prevent multi-touch conflicts. */
  private activePointerId: number | null = null;

  ngOnInit() {
    // Abort if rendering on the server (Angular Universal / SSR)
    if (!isPlatformBrowser(this.platformId)) return;

    const element = this.el.nativeElement as HTMLElement;

    const onContextMenu = (e: Event) => e.preventDefault();

    const listeners = [
      eventBinding('pointerdown', this.handlePointerDown),
      eventBinding('pointermove', this.handlePointerMove),
      eventBinding('pointerup', this.handlePointerUp),
      eventBinding('pointercancel', this.cancelGesture),
      eventBinding('pointerleave', this.cancelGesture),
      eventBinding('contextmenu', onContextMenu),
      // Use capture phase to intercept the click before it bubbles to Angular
      eventBinding('click', this.handleNativeClick, { capture: true }),
      eventBinding('keydown', this.handleKeyDown),
    ];

    for (const [event, handler, options] of listeners) {
      element.addEventListener(event, handler as EventListener, options);
    }

    // Cleanup memory when the directive is destroyed
    this.destroyRef.onDestroy(() => {
      for (const [event, handler, options] of listeners) {
        element.removeEventListener(event, handler as EventListener, options);
      }
    });
  }

  // --- ACCESSIBILITY (A11Y) ---
  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevents page scroll on Space
      this.tap.emit(event);
    }
  };

  // --- NATIVE INTERCEPTION ---
  private handleNativeClick = (event: MouseEvent) => {
    // Only suppress the click that fires immediately after a long press
    // to prevent double-firing. Normal taps are allowed through so that
    // routerLink, form submissions, and parent (click) bindings still work.
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  };

  // --- POINTER LOGIC ---
  private handlePointerDown = (event: PointerEvent) => {
    // Ignore right-clicks and non-primary buttons
    if (event.button !== 0) return;

    // Ignore secondary touches / pointers
    if (this.activePointerId !== null) return;

    this.activePointerId = event.pointerId;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.isLongPressing = false;

    this.timeoutId = setTimeout(() => {
      this.isLongPressing = true;
      this.suppressNextClick = true;

      // Trigger native device vibration in supported webviews (mostly Android)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      this.longPress.emit(event);
    }, this.touchThreshold());
  };

  private handlePointerMove = (event: PointerEvent) => {
    // Only track the pointer that initiated the gesture
    if (event.pointerId !== this.activePointerId) return;

    // If timer isn't running, ignore movement
    if (!this.timeoutId) return;

    const deltaX = Math.abs(event.clientX - this.startX);
    const deltaY = Math.abs(event.clientY - this.startY);

    // Cancel the hold if the user dragged their finger too far
    if (deltaX > this.touchTolerance() || deltaY > this.touchTolerance()) {
      this.cancelGesture();
    }
  };

  private handlePointerUp = (event: PointerEvent) => {
    // Only respond to the pointer that initiated the gesture
    if (event.pointerId !== this.activePointerId) return;

    const wasLongPressing = this.isLongPressing;
    this.clearTimer();
    this.activePointerId = null;

    // Only fire the tap event if the threshold wasn't reached
    if (!wasLongPressing) {
      this.tap.emit(event);
    }
  };

  /** Fully resets the gesture state back to idle. */
  private cancelGesture = () => {
    this.clearTimer();
    this.activePointerId = null;
  };

  private clearTimer = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
    this.isLongPressing = false;
  };
}
