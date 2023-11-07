import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import type { ITourStep } from '@picsa/shared/services/core/tour.service';
import { _wait } from '@picsa/utils';

/**
 * Example tour to select a site from list
 * Includes route listeners to automatically trigger table tour once table loaded
 */
export const CROP_PROBABILITY_SELECT_TOUR: ITourStep[] = [
  {
    id: 'station',
    text: 'Tap here to choose a station',

    tourOptions: {
      showBullets: false,
      showButtons: false,
    },
    // When user clicks on the station select suspend the tour so that the user can
    // interact with the select popup
    clickEvents: {
      handler: (service) => {
        service.pauseTour();
      },
    },
    // Resume the tour once the user has navigated to a station
    routeEvents: {
      handler: ({ queryParams }, service) => {
        if (queryParams.stationId) {
          _wait(500).then(() => {
            service.startTour(CROP_PROBABILITY_TABLE_TOUR);
          });
          return true;
        }
        return false;
      },
    },
  },
];

/**
 * Example tour to interact with crop probability table
 * Steps are independent of station select tour to make it easier to handle tables that
 * will be loaded dynamically
 */
export const CROP_PROBABILITY_TABLE_TOUR: ITourStep[] = [
  {
    customElement: {
      selector: 'section.table-container',
    },
    text: translateMarker(
      'In the crop information table, you will be able to see the probabilities for different crops through the different seasons.'
    ),
  },

  {
    id: 'season-start',
    text: translateMarker(
      'Crop probabilities depend on when the season starts.\nHere you can see the probabilities of the season starting at different dates'
    ),
  },
  {
    customElement: {
      selector: 'tr[mat-header-row]:last-of-type',
    },
    text: translateMarker(
      'Each row contains information about crop, variety, days to maturity and water requirement. Probabilities of receiving requirements are shown for different planting dates'
    ),
  },
  {
    customElement: {
      autoScroll: false,
      selector: 'tbody>tr>td:nth-of-type(2)',
    },
    text: translateMarker('Here we can see information for a specific crop variety'),
  },
  {
    customElement: {
      autoScroll: false,
      selector: 'tbody>tr>td:nth-of-type(3)',
    },
    text: translateMarker('This is the number of days to maturity for the variety'),
  },
  {
    customElement: {
      autoScroll: false,
      selector: 'tbody>tr>td:nth-of-type(4)',
    },
    text: translateMarker('This is water requirement for the variety'),
  },
  {
    customElement: {
      autoScroll: false,
      selector: 'tbody>tr',
    },
    text: translateMarker(
      'The maturity and water requirements can be used to calculate the chance of satisfying these conditions for different planting dates'
    ),
  },
  {
    customElement: {
      selector: 'crop-probability-crop-select',
    },
    text: translateMarker('The crop filter shows more information for specific crops'),
  },
  {
    text: translateMarker('Now you are ready to explore the crop information tool'),
  },
];
