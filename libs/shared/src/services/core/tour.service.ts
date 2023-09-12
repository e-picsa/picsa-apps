import { Injectable } from '@angular/core';
import introJs, { IntroJs, Options, Step } from 'intro.js';

export interface ITourStep extends Omit<Step, 'intro'> {
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
    const steps = tourSteps.map((step) => {
      const mappedStep: Step = {
        ...step,
        element: `[data-tour-id="${step.id}"]`,
        intro: step.text,
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
