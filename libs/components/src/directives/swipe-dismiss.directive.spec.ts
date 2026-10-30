import { ChangeDetectionStrategy, Component, Renderer2, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PicsaSwipeDismissDirective } from './swipe-dismiss.directive';

@Component({
  imports: [PicsaSwipeDismissDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="swipe-target"
      picsaSwipeDismiss
      [picsaSwipeDismissEnabled]="enabled()"
      (swipeDismiss)="dismissCount = dismissCount + 1"
    ></div>
  `,
})
class TestHostComponent {
  readonly enabled = signal(true);
  dismissCount = 0;
}

interface PointerInit {
  x: number;
  y: number;
  time: number;
  pointerType?: string;
}

function dispatchPointer(target: HTMLElement, type: string, init: PointerInit) {
  const event = new Event(type, { bubbles: true, cancelable: true }) as PointerEvent;
  Object.defineProperties(event, {
    clientX: { value: init.x },
    clientY: { value: init.y },
    pointerId: { value: 1 },
    pointerType: { value: init.pointerType ?? 'touch' },
    isPrimary: { value: true },
    button: { value: 0 },
    timeStamp: { value: init.time },
  });
  target.dispatchEvent(event);
}

describe('PicsaSwipeDismissDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let target: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    target = fixture.nativeElement.querySelector('.swipe-target');
    target.setPointerCapture = jest.fn();
    target.releasePointerCapture = jest.fn();
  });

  function swipe(startX: number, endX: number, startY = 0, endY = 0, duration = 100, pointerType = 'touch') {
    dispatchPointer(target, 'pointerdown', { x: startX, y: startY, time: 0, pointerType });
    dispatchPointer(target, 'pointermove', { x: endX, y: endY, time: duration, pointerType });
    dispatchPointer(target, 'pointerup', { x: endX, y: endY, time: duration + 10, pointerType });
  }

  it('binds touch-action to pan-y pinch-zoom when enabled and clears it when disabled', () => {
    const renderer = fixture.debugElement.injector.get(Renderer2);
    const setStyleSpy = jest.spyOn(renderer, 'setStyle');
    const removeStyleSpy = jest.spyOn(renderer, 'removeStyle');

    host.enabled.set(false);
    fixture.detectChanges();
    expect(removeStyleSpy).toHaveBeenCalledWith(target, 'touch-action', expect.anything());

    host.enabled.set(true);
    fixture.detectChanges();
    expect(setStyleSpy).toHaveBeenCalledWith(target, 'touch-action', 'pan-y pinch-zoom', expect.anything());
  });

  it('dismisses on a rightward touch swipe past the distance threshold', () => {
    swipe(0, 100);
    expect(host.dismissCount).toBe(1);
  });

  it('ignores mouse events by default to prevent desktop dragging conflicts', () => {
    swipe(0, 100, 0, 0, 100, 'mouse');
    expect(host.dismissCount).toBe(0);
  });

  it('ignores swipes when picsaSwipeDismissEnabled is false', () => {
    host.enabled.set(false);
    fixture.detectChanges();

    swipe(0, 100);
    expect(host.dismissCount).toBe(0);
  });

  it('ignores vertical drags so inner content maintains native scrolling', () => {
    swipe(0, 10, 0, 100);
    expect(host.dismissCount).toBe(0);
  });

  it('ignores slow horizontal movement below distance threshold', () => {
    swipe(0, 40, 0, 0, 200);
    expect(host.dismissCount).toBe(0);
  });

  it('ignores leftward swipes when swipeDirection is right', () => {
    swipe(100, 0);
    expect(host.dismissCount).toBe(0);
  });

  it('dismisses on a fast short flick', () => {
    swipe(0, 40, 0, 0, 20);
    expect(host.dismissCount).toBe(1);
  });

  it('ignores a flick that pauses before release', () => {
    dispatchPointer(target, 'pointerdown', { x: 0, y: 0, time: 0 });
    dispatchPointer(target, 'pointermove', { x: 40, y: 0, time: 20 });
    dispatchPointer(target, 'pointerup', { x: 40, y: 0, time: 200 });
    expect(host.dismissCount).toBe(0);
  });

  it('aborts when pointer is cancelled', () => {
    dispatchPointer(target, 'pointerdown', { x: 0, y: 0, time: 0 });
    dispatchPointer(target, 'pointermove', { x: 100, y: 0, time: 100 });
    dispatchPointer(target, 'pointercancel', { x: 100, y: 0, time: 110 });
    expect(host.dismissCount).toBe(0);
  });

  it('suppresses click event immediately following a swipe dismiss', () => {
    swipe(0, 100);
    expect(host.dismissCount).toBe(1);

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
    target.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
