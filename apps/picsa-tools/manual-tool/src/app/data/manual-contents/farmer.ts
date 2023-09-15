import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IManualActivity, IManualPeriodEntry } from './common';

/** Picsa manual contents organised by section and step */

export const PICSA_MANUAL_CONTENTS_FARMER: IManualPeriodEntry[] = [
  {
    label: translateMarker('PICSA'),
    steps: [
      {
        page: {
          en: 2,
          zm_ny: 7,
          mw_ny: 7,
        },
        name: '',
        label: translateMarker('Introduction'),
        type: 'step',
        activities: [],
      },

      {
        page: {
          en: 6,
          zm_ny: 11,
          mw_ny: 11,
        },
        name: translateMarker('Step A'),
        label: translateMarker('What does the farmer currently do?'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Resource Allocation Map (RAM)'),
            video: 'assets/videos/countdown.mp4',
            icon: 'picsa_manual_resource_allocation',
            id: 'ram-activity',
          },
          {
            label: translateMarker('Seasonal Calendar'),
            video: 'assets/videos/countdown.mp4',
            icon: 'picsa_manual_calender',
            id: 'calendar-activity',
          },
        ],
      },
      {
        page: {
          en: 10,
          zm_ny: 17,
          mw_ny: 17,
        },
        name: translateMarker('Step B'),
        label: translateMarker('Is the climate changing?'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Historic climate'),
            video: 'assets/videos/countdown.mp4',
            icon: 'picsa_manual_temperature',
            id: 'historic-climate-activity',
          },
        ],
      },
      {
        page: {
          en: 12,
          zm_ny: 20,
          mw_ny: 20,
        },
        name: translateMarker('Step C'),
        label: translateMarker('What are the opportunities and risks?'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Probability and Risk'),
            video: 'assets/videos/countdown.mp4',
            icon: 'picsa_manual_campus',
            id: 'probability-risk-activity',
          },
        ],
      },
      {
        page: {
          en: 14,
          zm_ny: 23,
          mw_ny: 23,
        },
        name: translateMarker('Step D'),
        label: translateMarker('What are the options for the farmer?'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Crop Info'),
            video: 'assets/videos/countdown.mp4',
            icon: 'picsa_manual_crop',
            id: 'crop-info-activity',
          },
          {
            label: translateMarker('Livestock Info'),
            video: 'assets/videos/countdown.mp4',
            icon: 'picsa_manual_livestock',
            id: 'livestock-info-activity',
          },
          {
            label: translateMarker('Livelihood Info'),
            video: 'assets/videos/countdown.mp4',
            icon: 'picsa_manual_place_holder',
            id: 'livelihood-info-activity',
          },
        ],
      },
      {
        page: {
          en: 16,
          zm_ny: 26,
          mw_ny: 26,
        },
        name: translateMarker('Step E'),
        label: translateMarker('Options by context'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Farmers choose'),
            video: 'assets/videos/countdown.mp4',
            icon: 'picsa_manual_place_holder',
            id: 'farmers-choose-activity',
          },
        ],
      },
      {
        page: {
          en: 17,
          zm_ny: 27,
          mw_ny: 27,
        },
        name: translateMarker('Step F'),
        label: translateMarker('Comparing different options and planning using Participatory Budgets'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Budget'),
            video: 'assets/videos/countdown.mp4',
            icon: 'picsa_manual_place_holder',
            id: 'budget-activity',
          },
        ],
      },
      {
        page: {
          en: 19,
          zm_ny: 30,
          mw_ny: 30,
        },
        name: translateMarker('Step G'),
        label: translateMarker('The farmer decides'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Select and amend'),
            video: 'assets/videos/countdown.mp4',
            icon: 'picsa_manual_place_holder',
            id: 'select-amend-activity',
          },
        ],
      },
    ],
  },
];

/** Picsa manual contents organised by section only */
const PICSA_MANUAL_GRID_DATA_FARMER: IManualActivity[] = [];

for (const period of PICSA_MANUAL_CONTENTS_FARMER) {
  for (const step of period.steps) {
    for (const item of step.activities) {
      PICSA_MANUAL_GRID_DATA_FARMER.push(item);
    }
  }
}

export { PICSA_MANUAL_GRID_DATA_FARMER };
