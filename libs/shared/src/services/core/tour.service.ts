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

  public getCurrentStep() {
    return this.intro._currentStep;
  }

  public advanceToNextStep(tourStep: number) {
    this.intro.goToStep(tourStep);
  }

  public onBeforeChange(onBeforeChangeFunction: Function = () => {}) {
    this.intro.onbeforechange(onBeforeChangeFunction()).start();
  }

  // private handleBeforeNext(tourSteps: ITourStep[]) {
  //   const currentStep = this.intro._currentStep; // Get the current step
  //   if (tourSteps[currentStep].elementToClick !== undefined) {
  //     // If there's an element to click, trigger a click event
  //     const elementToClick: HTMLElement = document.querySelector(tourSteps[currentStep].elementToClick!);
  //     if (elementToClick) {
  //       elementToClick.click();
  //     }
  //   }
  // }
}
