import type { ITourStep } from '@picsa/shared/services/core/tour.service';

export const CROP_PROBABILITY_TOUR: ITourStep[] = [
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
          service.resumeTour();
        }
        return false;
      },
    },
  },

  {
    customElement: {
      selector: 'section.table-container',
    },
    text: 'In the crop information table, you will be able to see the probabilities for different crops through the different seasons.',
    tourOptions: {
      disableInteraction: true,
    },
  },
  {
    customElement: {
      selector: 'crop-probability-crop-select',
    },
    text: 'Click one of these crop icons for the table to show you information for only that crop.',
  },
];
