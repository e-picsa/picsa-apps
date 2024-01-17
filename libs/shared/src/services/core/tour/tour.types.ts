import type { Params } from '@angular/router';

import type { IntroStep } from 'intro.js/src/core/steps';
import type { Options } from 'intro.js/src/option';
import type { TourService } from './tour.service';

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
    /** Auto scroll to element (default: true) */
    autoScroll?: boolean;
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
