import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import {
  ForecastScrollAffordanceDirective,
  getActiveCardIndex,
  getScrollAffordanceState,
} from './forecast-scroll-affordance.directive';

describe('getScrollAffordanceState', () => {
  it('returns no affordance when content fits', () => {
    expect(getScrollAffordanceState({ scrollLeft: 0, scrollWidth: 300, clientWidth: 320 })).toEqual({
      before: false,
      after: false,
    });
  });

  it('shows after affordance at scroll start when overflowed', () => {
    expect(getScrollAffordanceState({ scrollLeft: 0, scrollWidth: 600, clientWidth: 320 })).toEqual({
      before: false,
      after: true,
    });
  });

  it('shows both affordances mid-scroll', () => {
    expect(getScrollAffordanceState({ scrollLeft: 140, scrollWidth: 600, clientWidth: 320 })).toEqual({
      before: true,
      after: true,
    });
  });

  it('shows only before affordance at scroll end', () => {
    expect(getScrollAffordanceState({ scrollLeft: 280, scrollWidth: 600, clientWidth: 320 })).toEqual({
      before: true,
      after: false,
    });
  });

  it('ignores sub-pixel rounding noise', () => {
    expect(getScrollAffordanceState({ scrollLeft: 0, scrollWidth: 320.5, clientWidth: 320 })).toEqual({
      before: false,
      after: false,
    });
  });
});

describe('getActiveCardIndex', () => {
  const MAX = 500;
  const COUNT = 5;

  it('returns first dot at scroll start', () => {
    expect(getActiveCardIndex(0, MAX, COUNT)).toBe(0);
  });

  it('maps scroll progress proportionally across dots', () => {
    expect(getActiveCardIndex(125, MAX, COUNT)).toBe(1);
    expect(getActiveCardIndex(250, MAX, COUNT)).toBe(2);
    expect(getActiveCardIndex(375, MAX, COUNT)).toBe(3);
  });

  it('returns last dot at scroll end', () => {
    expect(getActiveCardIndex(MAX, MAX, COUNT)).toBe(COUNT - 1);
  });

  it('clamps out-of-range positions', () => {
    expect(getActiveCardIndex(9999, MAX, COUNT)).toBe(COUNT - 1);
    expect(getActiveCardIndex(-20, MAX, COUNT)).toBe(0);
  });

  it('returns 0 without measurable overflow', () => {
    expect(getActiveCardIndex(100, 0, COUNT)).toBe(0);
    expect(getActiveCardIndex(100, MAX, 0)).toBe(0);
  });
});

@Component({
  template: `<div forecastScrollAffordance><span></span><span></span><span></span></div>`,
  imports: [ForecastScrollAffordanceDirective],
})
class TestHostComponent {}

describe('ForecastScrollAffordanceDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let directive: ForecastScrollAffordanceDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    directive = fixture.debugElement
      .query(By.directive(ForecastScrollAffordanceDirective))
      .injector.get(ForecastScrollAffordanceDirective);
  });

  it('syncs card count from rendered children', () => {
    expect(directive.cardCount()).toBe(3);
    expect(directive.dotIndexes()).toEqual([0, 1, 2]);
  });

  it('shows no dots without measurable overflow', () => {
    // jsdom has no layout so scrollWidth never exceeds clientWidth
    expect(directive.hasOverflow()).toBe(false);
    expect(directive.showDots()).toBe(false);
  });
});
