import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { _wait } from '@picsa/utils';
import introJs from 'intro.js';
import type { IntroStep } from 'intro.js/src/core/steps';
import type { IntroJs } from 'intro.js/src/intro';
import type { Options } from 'intro.js/src/option';
import { filter, map, merge, skip, Subscription, take } from 'rxjs';
import type { ITourStep } from './tour.types';

const DEFAULT_OPTIONS: Partial<Options> = {
  hidePrev: true,
  exitOnOverlayClick: false,
  tooltipClass: 'picsa-tooltip',
  // disable default scrollToElement to handle with own methods
  scrollToElement: false,
};

/** Interact with Intro.JS tours */
@Injectable({ providedIn: 'root' })
export class TourService {
  private registeredTours: Record<string, ITourStep[]> = {};

  private intro: IntroJs;

  /** List of active tour steps as configured on tour start */
  private tourSteps: ITourStep[];

  /** List of options as configured on tour start */
  private initialOptions: Partial<Options> = {};

  /** HTML element selector used by intro.js */
  private tourRootElSelector?: string | undefined;

  /** Active route event subscriptions */
  private routeEvents$: Subscription;

  /** Active click event handlers */
  private clickEvents?: {
    target: HTMLElement;
    fn: () => void;
  };

  /** Track if tour has been manually paused so that event listeners can be preserved */
  private tourPaused = false;

  constructor(private route: ActivatedRoute) {}

  /**
   * Specify whether tour is being used inside a mat tab (e.g. nested farmer activities)
   * This will change the root element that the tour is created from to allow interaction
   * https://github.com/usablica/intro.js/issues/1202
   */
  public set useInMatTab(enabled: boolean) {
    this.tourRootElSelector = enabled ? 'mat-tab-body.mat-mdc-tab-body-active' : undefined;
  }

  /** Register a set of tour steps to allow triggering by id */
  public registerTour(id: string, steps: ITourStep[]) {
    console.log('register tour 1', id, steps);
    this.registeredTours[id] = steps;
  }

  /** Hide tour interface but retain event subscribers that may be used to resume */
  public async pauseTour() {
    this.tourPaused = true;
    await this.intro.exit(true);
  }

  /** Resume a tour, triggering the next step from when tour was paused */
  public async resumeTour() {
    this.intro._currentStep = this.intro.currentStep() + 1;
    await this.intro.nextStep();
  }

  public async startTourById(id: string) {
    const tourSteps = this.registeredTours[id];
    if (!tourSteps) {
      throw new Error(`[${id}] tour must be registered by use`);
    }
    this.startTour(tourSteps);
  }

  public async startTour(tourSteps: ITourStep[], tourOptions: Partial<Options> = {}) {
    this.prepareTour(tourSteps, tourOptions);
    await this.intro.start();
  }

  /** Set tour options - any provided will be merged with default initial options */
  private async setTourOptions(options: Partial<Options> = {}) {
    const mergedOptions = { ...this.initialOptions, ...options };
    this.intro.setOptions(mergedOptions);
  }

  /** Prepare for tour start, setting initial options and adding event listers */
  private prepareTour(tourSteps: ITourStep[], tourOptions: Partial<Options> = {}) {
    this.initIntroJS();
    this.tourSteps = tourSteps;

    // set initial tour options, provides fallback for step-based overrides
    this.initialOptions = {
      ...this.intro._options,
      ...DEFAULT_OPTIONS,
      ...tourOptions,
      steps: this.mapTourSteps(),
    };

    this.intro.setOptions(this.initialOptions);

    this.intro.onbeforechange(async (el, stepIndex) => {
      await this.fixPopupPositioning('before');
      await this.prepareNextStep(stepIndex);
      return true;
    });

    this.intro.onafterchange(async (el) => {
      await this.fixPopupPositioning('after', el);
    });

    this.intro.onexit(async () => {
      if (!this.tourPaused) {
        this.removeEventListeners();
      }
    });
  }

  /**
   * When changing to next step ensure custom tour options applied, target element ready and in view, and
   * event listeners attached
   */
  private async prepareNextStep(stepIndex: number) {
    this.tourPaused = false;
    const stepOptions = this.tourSteps[stepIndex];
    if (stepOptions) {
      this.setTourOptions(stepOptions.tourOptions);
      await this.prepareNextStepElement(stepIndex);
      await this.prepareNextStepEvents(stepIndex);
    }
  }

  /**
   * Wait for step elements to be visible and set as target element for a step
   * https://stackoverflow.com/questions/36650854/how-to-make-intro-js-select-the-element-that-dynamically-generated-after-page-lo
   *
   * Ensure target element scrolled into view and scroll animation complete before triggerring intro.js to prepare tooltip
   * https://github.com/usablica/intro.js/issues/929
   */
  private async prepareNextStepElement(stepIndex: number) {
    const stepOptions = this.tourSteps[stepIndex];
    const { customElement, id } = stepOptions;
    const stepSelector = id ? `[data-tour-id="${id}"]` : customElement?.selector;
    if (stepSelector) {
      const stepTargetEl = await this.waitForElement(stepSelector);
      if (stepTargetEl) {
        this.intro._introItems[stepIndex].element = stepTargetEl;
        if (customElement?.autoScroll !== false) {
          // include wait either side of scroll to provide time for any other dom changes to take effect
          await _wait(250);
          await this.scrollToElement(stepTargetEl);

          // Force intro to re-evaluate tooltip positioning now that target element scrolled into view
          this.intro.refresh();
        }
      }
    }
  }

  /**
   * A series of hacky workaround to fix issues identified with tooltip positioning
   * when running tour on different sized devices
   * @param targetEl
   * @returns
   */
  private async fixPopupPositioning(event: 'before' | 'after', targetEl?: HTMLElement) {
    // Handle before trigger - revert changes from previous step and hide tooltip until after fix
    if (event === 'before') {
      const tooltipEl = document.querySelector<HTMLElement>('div.introjs-tooltip.picsa-tooltip');
      if (tooltipEl) {
        tooltipEl.style.opacity = '0';
        await _wait(200);
        tooltipEl.style.position = 'absolute';
        await _wait(200);
      }
      return;
    }
    // Handle after trigger- ensure tooltips positioned correctly
    if (targetEl) {
      // ignore elements that fill full page (intro usually centers tooltip correctly)
      const targetRect = targetEl.getBoundingClientRect();
      if (targetRect.height > window.innerHeight) {
        // ensure el was scrolled properly and intro does not accidentally rescroll/move
        // (happens if focus element larger than screen size)
        targetEl.scrollIntoView({ behavior: 'instant', block: 'start', inline: 'start' });
        return;
      }
      // allow tooltip animation to complete before trying to adjust margins
      await _wait(350);
      const tooltipEl = await this.waitForElement('div.introjs-tooltip.picsa-tooltip');
      if (tooltipEl) {
        // fix case  on small devices where tooltip may be off screen
        const { left, right, width } = tooltipEl.getBoundingClientRect();
        const { innerWidth } = window;
        const xOffScreen = left < 0 || right > innerWidth;
        if (xOffScreen) {
          // adjust horizontal positioning to account for any page scroll
          let scrollX = 0;
          document.querySelectorAll('.page').forEach(({ scrollLeft }) => (scrollX = Math.max(scrollLeft, scrollX)));
          // Adjust x-axis to sit fixed in middle of screen
          // adjust y-axis to sit below element or in center of screen
          const adjustedLeft = Math.round((innerWidth - width) / 2);
          const adjustedTop = targetEl.getBoundingClientRect().bottom + 16;
          tooltipEl.style.position = 'fixed';
          tooltipEl.style.left = `${adjustedLeft}px`;
          tooltipEl.style.top = `${adjustedTop}px`;
        }
        await _wait(500);
        tooltipEl.style.opacity = '1';
      }
    }
  }

  /**
   * Provide a custom method to scroll to target element and wait for action to be complete
   * Intersection observer used as scroll method has not callback function to indicate complete
   * https://github.com/w3c/csswg-drafts/issues/3744
   */
  private async scrollToElement(el: HTMLElement) {
    const { paddingTop, marginTop } = el.style;
    // Try to ensure element is scrolled to with 32px top space (deduct existing padding and margins)
    const scrollMarginTop = `calc(32px - ${paddingTop || '0px'} - ${marginTop || '0px'})`;
    el.style.scrollMarginTop = scrollMarginTop;
    // Setup scroll observer
    let observer: IntersectionObserver;
    await new Promise((resolve) => {
      observer = new IntersectionObserver(
        // when the observer detects the element is in view stop opserving and resolve promise
        () => {
          observer.disconnect();
          resolve(true);
        },
        // require the element to be at least 90% in scroll view before resolving
        // NOTE - this still doesn't fully guarantee scrolling action complete, so recommend
        // including small timeout after if essential for scrolling to be fully complete
        {
          root: null,
          rootMargin: '0px',
          threshold: 1.0,
        }
      );
      observer.observe(el);
      el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
    });
    // additional wait to ensure animations complete
    await _wait(500);
  }

  /** Add support for route change and element click event callbacks */
  private async prepareNextStepEvents(stepIndex: number) {
    const stepOptions = this.tourSteps[stepIndex];
    const { routeEvents, clickEvents, id } = stepOptions;
    if (clickEvents) {
      const selector = clickEvents.selector || `[data-tour-id="${id}"]`;
      const target = await this.waitForElement(selector);
      if (target) {
        const fn = () => {
          clickEvents.handler(this);
          this.clickEvents = undefined;
        };
        this.clickEvents = { target, fn };
        target.addEventListener('click', this.clickEvents.fn, { once: true });
      }
    }
    if (routeEvents) {
      // Combine both route param and route query param changes into a single observable
      // End once handler indicates processed succesfully
      const routeChanges = merge(this.route.params, this.route.queryParams).pipe(
        skip(2), // ignore existing values emit
        map(() => {
          const { params, queryParams } = this.route.snapshot;
          return { params, queryParams };
        }),
        // use filter callback to detect if handler completes action successfully
        // so that a take() operator can be used to end subscription after first emit
        filter((v) => {
          const wasHandled = routeEvents.handler(v, this);
          return wasHandled;
        }),
        take(1)
      );
      this.routeEvents$ = routeChanges.subscribe();
    }
  }

  private removeEventListeners() {
    if (this.routeEvents$) {
      this.routeEvents$.unsubscribe();
    }
    if (this.clickEvents) {
      const { target, fn } = this.clickEvents;
      target.removeEventListener('click', fn);
    }
  }

  /** Check if an element exists in the dom, waiting a maximun of 2s before resolving */
  private async waitForElement(selector: string, retryCount = 0): Promise<HTMLElement | undefined> {
    const targetEl = document.querySelector(selector) as HTMLElement;
    if (targetEl) {
      return targetEl;
    } else {
      // retry max 10 times (2s)
      if (retryCount > 10) return;
      await _wait(200);
      return this.waitForElement(selector, retryCount + 1);
    }
  }

  /**
   * map passed tourId to data attribute selector
   * @returns
   */
  private mapTourSteps() {
    return this.tourSteps.map((tourStep, i) => {
      const { id, text, customElement } = tourStep;
      const mappedStep: Partial<IntroStep> = {
        ...tourStep,
        intro: text,
      };
      if (id) {
        mappedStep.element = `[data-tour-id="${tourStep.id}"]`;
      }
      if (customElement) {
        mappedStep.element = document.querySelector(customElement.selector) as HTMLElement;
      }
      return mappedStep;
    });
  }

  /** Instantiate intro.js, binding to target root element as required */
  private initIntroJS() {
    let tourRootEl: HTMLElement | undefined;
    // bind tour to root element to allow for use within nested/stacked contexts (e.g. modals, tabs)
    if (this.tourRootElSelector) {
      tourRootEl = document.querySelector(this.tourRootElSelector) as HTMLElement;
      if (!tourRootEl) {
        console.error('Cannot start tour, could not find root element: ' + this.tourRootElSelector);
        return;
      }
    }
    this.intro = introJs(tourRootEl);
  }
}

/**
 * Compare two element bounding boxes to check if they intersect
 * */
function doElementsOverlap(el1: HTMLElement, el2: HTMLElement) {
  const a = el1.getBoundingClientRect();
  const b = el2.getBoundingClientRect();
  function isVerticalOverlap() {
    return a.bottom > b.top && a.top < b.bottom;
  }
  function isHorizontalOverlap() {
    return a.right > b.left && a.left < b.right;
  }
  return isVerticalOverlap() && isHorizontalOverlap();
}

function isOffScreen(el: HTMLElement) {
  const { left, right, top, bottom } = el.getBoundingClientRect();
  const { innerWidth, innerHeight } = window;
  return left < 0 || top < 0 || right > innerWidth || bottom > innerHeight;
}
