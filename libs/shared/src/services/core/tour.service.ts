import { Injectable } from '@angular/core';
import introJs from 'intro.js';
import type { IntroStep } from 'intro.js/src/core/steps';
import type { IntroJs } from 'intro.js/src/intro';
import type { Options } from 'intro.js/src/option';

export interface ITourStep extends Partial<IntroStep> {
  id: string;
  text: string;
}

@Injectable({ providedIn: 'root' })
/**
 * Interact with Intro.JS tours
 */
export class TourService {
  private intro: IntroJs;
  constructor() {
    this.intro = introJs();
  }

  public startTour(tourSteps: ITourStep[], tourOptions: Partial<Options> = {}): void {
    // map passed tourId to data attribute selector
    const steps = tourSteps.map((tourStep, i) => {
      const mappedStep: Partial<IntroStep> = {
        ...tourStep,
        element: `[data-tour-id="${tourStep.id}"]`,
        intro: tourStep.text,
      };
      return mappedStep;
    });
    console.log('starting tour', steps);

    this.intro
      .setOptions({
        hidePrev: true,
        exitOnOverlayClick: false,
        tooltipClass: 'picsa-tooltip',
        steps,
        ...tourOptions,
      })
      .start();
  }
}
