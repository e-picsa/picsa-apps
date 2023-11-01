import { Injectable } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { _wait } from '@picsa/utils';
import introJs from 'intro.js';
import type { IntroStep } from 'intro.js/src/core/steps';
import type { IntroJs } from 'intro.js/src/intro';
import type { Options } from 'intro.js/src/option';
import { filter, map, merge, skip, Subscription, take } from 'rxjs';

export interface ITourStep extends Partial<IntroStep> {
  /** value of target element selector, selected by [attr.data-tour-id]  */
  id?: string;

  /** Text to display in tour step */
  text: string;

  /** Specific tour options that will only be enabled for step */
  tourOptions?: Partial<Options>;

  /**
   * Provide a custom element selector to use as intro element.
   * Supports elements dynamically injected into dom (will wait max 2s for visisble) */
  customElement?: {
    selector: string;
  };

  /** Add custom handler for click events. Will be triggered once */
  clickEvents?: {
    /** Element to add click event listener to via querySelectorAll. Default to step target el */
    selector?: string;
    handler: (service: TourService) => void;
  };

  /**
   * Add custom handler for route events. Triggers on any route param or queryParam changes
   * Must return boolean value that indicates whether event handled and subscriptions can be removed
   * */
  routeEvents?: {
    handler: (data: { params: Params; queryParams: Params }, service: TourService) => boolean;
  };
}

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
      await this.prepareNextStep(stepIndex);
      return true;
    });

    this.intro.onafterchange(async (el) => {
      // ensure el was scrolled properly and intro does not accidentally rescroll/move
      // (happens if focus element larger than screen size)
      el.scrollIntoView({ behavior: 'instant', block: 'start', inline: 'nearest' });
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
   * Wait for any custom elements to be visible and set as target element for a step
   * https://stackoverflow.com/questions/36650854/how-to-make-intro-js-select-the-element-that-dynamically-generated-after-page-lo
   *
   * Ensure target element scrolled into view and scroll animation complete before triggerring intro.js to prepare tooltip
   * https://github.com/usablica/intro.js/issues/929
   */
  private async prepareNextStepElement(stepIndex: number) {
    const stepOptions = this.tourSteps[stepIndex];
    const { customElement } = stepOptions;
    let targetEl = this.intro._introItems[stepIndex].element as HTMLElement | undefined;
    if (customElement) {
      const customEl = await this.waitForElement(customElement.selector);
      if (customEl) {
        this.intro._introItems[stepIndex].element = customEl;
        targetEl = customEl;
      }
    }

    if (targetEl) {
      // include wait either side of scroll to provide time for any other dom changes to take effect
      await _wait(250);
      await this.scrollToElement(targetEl);
      await _wait(250);
      // Force intro to re-evaluate tooltip positioning now that target element scrolled into view
      this.intro.refresh();
    }
  }

  /**
   * Provide a custom method to scroll to target element and wait for animation to be complete
   * Intersection observer used as scroll action has not callback function to indicate complete
   * https://github.com/w3c/csswg-drafts/issues/3744
   */
  private async scrollToElement(el: HTMLElement) {
    el.style.scrollMarginTop = '32px';

    let observer: IntersectionObserver;
    await new Promise((resolve) => {
      observer = new IntersectionObserver(
        () => {
          observer.disconnect();
          resolve(true);
        },
        {
          root: null,
          rootMargin: '0px',
          threshold: 0.9,
        }
      );
      observer.observe(el);
      el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    });
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

/** Compare two element bounding boxes to check if they intersect */
function doElementsOverlap(el1: HTMLElement, el2: HTMLElement) {
  const a = el1.getBoundingClientRect();
  const b = el2.getBoundingClientRect();
  if (a.top < b.top && a.bottom > b.top) return true;
  if (a.top < b.bottom && a.bottom > b.bottom) return true;
  if (a.left < b.left && a.left > b.left) return true;
  if (a.left < b.right && a.left > b.right) return true;
  return false;
}
