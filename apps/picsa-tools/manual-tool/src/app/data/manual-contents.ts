import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

interface IManualPeriodEntry {
  label: string;
  steps: IManualStep[];
}
export interface IManualStep {
  page: {
    [code: string]: number;
  };
  name: string;
  label: string;
  type: 'step';
  activities: IManualActivity[];
}
export interface IManualActivity {
  label: string;
  video: string;
  icon: string;
  id: string;
}

/** Picsa manual contents organised by section and step */

export const PICSA_MANUAL_LIST_DATA: IManualPeriodEntry[] = [
  {
    label: translateMarker('Long before the season'),
    steps: [
      {
        page: {
          en: 11,
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
          en: 16,
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
          en: 25,
        },
        name: translateMarker('Step C'),
        label: translateMarker('What are the probabilities and risks?'),
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
          en: 29,
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
          en: 39,
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
          en: 41,
        },
        name: translateMarker('Step F'),
        label: translateMarker('Compare different options and plans'),
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
          en: 45,
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
  {
    label: translateMarker('Just before the season'),
    steps: [
      {
        page: {
          en: 48,
        },
        name: translateMarker('Step H'),
        label: translateMarker('Seasonal forecast'),
        type: 'step',
        activities: [],
      },
      {
        page: {
          en: 52,
        },
        name: translateMarker('Step I'),
        label: translateMarker('Response to forecast'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Revisit'),
            video: 'assets/videos/countdown.mp4',
            icon: 'picsa_manual_place_holder',
            id: 'revisit-activity',
          },
        ],
      },
    ],
  },
  {
    label: translateMarker('During the season'),
    steps: [
      {
        page: {
          en: 55,
        },
        name: translateMarker('Step J'),
        label: translateMarker('Short-term forecasts and warnings'),
        type: 'step',
        activities: [],
      },
      {
        page: {
          en: 57,
        },
        name: translateMarker('Step K'),
        label: translateMarker('Response to forecast'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Revisit'),
            video: 'assets/videos/countdown.mp4',
            icon: 'picsa_manual_place_holder',
            id: 'revisit-activity',
          },
        ],
      },
    ],
  },
  {
    label: translateMarker('After the season'),
    steps: [
      {
        page: {
          en: 59,
        },
        name: translateMarker('Step L'),
        label: translateMarker('Learn and improve'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Review'),
            video: 'assets/videos/countdown.mp4',
            icon: 'picsa_manual_place_holder',
            id: 'review-activity',
          },
        ],
      },
    ],
  },
];

/** Picsa manual contents organised by section only */
const PICSA_MANUAL_GRID_DATA: IManualActivity[] = [];

for (const period of PICSA_MANUAL_LIST_DATA) {
  for (const step of period.steps) {
    for (const item of step.activities) {
      PICSA_MANUAL_GRID_DATA.push(item);
    }
  }
}

export { PICSA_MANUAL_GRID_DATA };
