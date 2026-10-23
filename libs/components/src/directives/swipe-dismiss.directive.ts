import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Directive, ElementRef, inject, input, NgZone, OnInit, output, PLATFORM_ID } from '@angular/core';

/** Movement (px) required before a gesture commits to an axis */
const AXIS_SLOP = 10;
/** Minimum horizontal travel (px) for a short flick to dismiss */
const FLICK_DISTANCE = 24;
/** Velocity samples older than this (ms) are treated as a stationary release */
const VELOCITY_TIMEOUT = 80;

type GestureAxis = 'pending' | 'horizontal' | 'vertical';

/**
 * Emits `swipeDismiss` when the host is swiped past a distance or velocity threshold.
 * Gestures that commit vertically are ignored so inner scroll containers maintain native behavior.
 * Gated by event pointerType (default 'touch') and enabled input.
 */
@Directive({
  selector: '[picsaSwipeDismiss]',
  standalone: true,
})
export class PicsaSwipeDismissDirective implements OnInit {
  /** Whether the swipe dismiss gesture detection is active */
  readonly picsaSwipeDismissEnabled = input<boolean>(true);

  /** Swipe direction that triggers dismiss: 'right' (default) or 'left' */
  readonly swipeDirection = input<'right' | 'left'>('right');

  /** Minimum distance (px) before dismissing */
  readonly swipeThreshold = input<number>(60);

  /** Minimum velocity (px/ms) for a short flick to dismiss */
  readonly swipeVelocity = input<number>(0.5);

  /** Allowed pointer types (defaults to touch only to avoid interfering with mouse clicks/drags) */
  readonly allowedPointerTypes = input<string[]>(['touch']);

  readonly swipeDismiss = output<void>();

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  private activePointerId: number | null = null;
  private startX = 0;
  private startY = 0;
  private lastX = 0;
  private lastTime = 0;
  private velocityX = 0;
  private axis: GestureAxis = 'pending';
  private captured = false;
  private suppressNextClick = false;
  private suppressClickTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const element = this.el.nativeElement;

    // Attach listeners outside Angular zone to prevent pointermove from triggering change detection cycles
    this.ngZone.runOutsideAngular(() => {
      element.addEventListener('pointerdown', this.handlePointerDown);
      element.addEventListener('pointermove', this.handlePointerMove);
      element.addEventListener('pointerup', this.handlePointerUp);
      element.addEventListener('pointercancel', this.handlePointerCancel);
      element.addEventListener('click', this.handleClick, { capture: true });
    });

    this.destroyRef.onDestroy(() => {
      element.removeEventListener('pointerdown', this.handlePointerDown);
      element.removeEventListener('pointermove', this.handlePointerMove);
      element.removeEventListener('pointerup', this.handlePointerUp);
      element.removeEventListener('pointercancel', this.handlePointerCancel);
      element.removeEventListener('click', this.handleClick, { capture: true });
      if (this.suppressClickTimeout) {
        clearTimeout(this.suppressClickTimeout);
      }
    });
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (!this.picsaSwipeDismissEnabled()) return;
    if (!event.isPrimary || event.button !== 0) return;
    if (!this.allowedPointerTypes().includes(event.pointerType)) return;
    if (this.activePointerId !== null) return;

    this.activePointerId = event.pointerId;
    this.startX = this.lastX = event.clientX;
    this.startY = event.clientY;
    this.lastTime = event.timeStamp;
    this.velocityX = 0;
    this.axis = 'pending';
    this.captured = false;
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) return;

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    if (this.axis === 'pending') {
      if (Math.abs(dx) < AXIS_SLOP && Math.abs(dy) < AXIS_SLOP) return;
      this.axis = Math.abs(dx) > Math.abs(dy) * 1.5 ? 'horizontal' : 'vertical';
      if (this.axis !== 'horizontal') return;

      this.captured = this.tryCapture(event.pointerId);
    }

    const elapsed = event.timeStamp - this.lastTime;
    if (elapsed > 0) {
      this.velocityX = (event.clientX - this.lastX) / elapsed;
      this.lastX = event.clientX;
      this.lastTime = event.timeStamp;
    }
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) return;

    if (this.axis === 'horizontal') {
      const dx = event.clientX - this.startX;
      const idle = event.timeStamp - this.lastTime;
      const velocity = idle > VELOCITY_TIMEOUT ? 0 : this.velocityX;
      const width = this.el.nativeElement.getBoundingClientRect().width;
      const minDistance = Math.max(this.swipeThreshold(), width * 0.2);

      const isRight = this.swipeDirection() === 'right';
      const meetsDistance = isRight ? dx >= minDistance : -dx >= minDistance;
      const meetsVelocity = isRight
        ? dx >= FLICK_DISTANCE && velocity >= this.swipeVelocity()
        : -dx >= FLICK_DISTANCE && -velocity >= this.swipeVelocity();

      const shouldDismiss = meetsDistance || meetsVelocity;

      if (shouldDismiss) {
        this.suppressNextClick = true;
        if (this.suppressClickTimeout) clearTimeout(this.suppressClickTimeout);
        this.suppressClickTimeout = setTimeout(() => {
          this.suppressNextClick = false;
        }, 100);

        this.ngZone.run(() => {
          this.swipeDismiss.emit();
        });
      }
    }

    this.reset(event.pointerId);
  };

  private handlePointerCancel = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) return;
    this.reset(event.pointerId);
  };

  private handleClick = (event: MouseEvent): void => {
    if (!this.suppressNextClick) return;
    this.suppressNextClick = false;
    if (this.suppressClickTimeout) {
      clearTimeout(this.suppressClickTimeout);
      this.suppressClickTimeout = null;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  private reset(pointerId: number): void {
    if (this.captured) {
      try {
        this.el.nativeElement.releasePointerCapture(pointerId);
      } catch {
        // Pointer capture may have already been released
      }
    }
    this.activePointerId = null;
    this.axis = 'pending';
    this.captured = false;
  }

  private tryCapture(pointerId: number): boolean {
    try {
      this.el.nativeElement.setPointerCapture(pointerId);
      return true;
    } catch {
      return false;
    }
  }
}
