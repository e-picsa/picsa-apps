import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IManualPeriodEntry } from '../../models';

/** Picsa manual contents organised by section and step */

export const PICSA_MANUAL_CONTENTS_EXTENSION: IManualPeriodEntry[] = [
  {
    label: '',
    steps: [
      {
        page: {
          global_en: 5,
          zm_ny: 5,
          mw_ny: 5,
        },
        name: '',
        label: translateMarker('Introduction'),
        type: 'step',
        activities: [],
      },
      {
        page: {
          global_en: 8,
          zm_ny: 10,
          mw_ny: 10,
        },
        name: '',
        label: translateMarker('Activity Flow Chart'),
        type: 'step',
        activities: [],
      },
    ],
  },
  {
    label: translateMarker('Long before the season'),
    steps: [
      {
        page: {
          global_en: 11,
          zm_ny: 13,
          mw_ny: 13,
        },
        name: translateMarker('Step A'),
        label: translateMarker('What does the farmer currently do?'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Resource Allocation Map (RAM)'),
            svgIcon: 'manual_tool:resource_allocation',
            id: 'ram-activity',
          },
          {
            label: translateMarker('Seasonal Calendar'),
            svgIcon: 'manual_tool:calendar',
            id: 'calendar-activity',
          },
        ],
      },
      {
        page: {
          global_en: 16,
          zm_ny: 18,
          mw_ny: 18,
        },
        name: translateMarker('Step B'),
        label: translateMarker('Is the climate changing?'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Historic climate'),
            svgIcon: 'manual_tool:temperature',
            id: 'historic-climate-activity',
          },
        ],
      },
      {
        page: {
          global_en: 25,
          zm_ny: 27,
          mw_ny: 27,
        },
        name: translateMarker('Step C'),
        label: translateMarker('What are the probabilities and risks?'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Probability and Risk'),
            svgIcon: 'manual_tool:campus',
            id: 'probability-risk-activity',
          },
        ],
      },
      {
        page: {
          global_en: 29,
          zm_ny: 31,
          mw_ny: 31,
        },
        name: translateMarker('Step D'),
        label: translateMarker('What are the options for the farmer?'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Crop Info'),
            svgIcon: 'manual_tool:crop',
            id: 'crop-info-activity',
          },
          {
            label: translateMarker('Livestock Info'),
            svgIcon: 'manual_tool:livestock',
            id: 'livestock-info-activity',
          },
          {
            label: translateMarker('Livelihood Info'),
            svgIcon: 'manual_tool:place_holder',
            id: 'livelihood-info-activity',
          },
        ],
      },
      {
        page: {
          global_en: 39,
          zm_ny: 41,
          mw_ny: 41,
        },
        name: translateMarker('Step E'),
        label: translateMarker('Options by context'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Farmers choose'),
            svgIcon: 'manual_tool:place_holder',
            id: 'farmers-choose-activity',
          },
        ],
      },
      {
        page: {
          global_en: 41,
          zm_ny: 43,
          mw_ny: 43,
        },
        name: translateMarker('Step F'),
        label: translateMarker('Compare different options and plans'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Budget'),
            svgIcon: 'manual_tool:place_holder',
            id: 'budget-activity',
          },
        ],
      },
      {
        page: {
          global_en: 45,
          zm_ny: 47,
          mw_ny: 47,
        },
        name: translateMarker('Step G'),
        label: translateMarker('The farmer decides'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Select and amend'),
            svgIcon: 'manual_tool:place_holder',
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
          global_en: 48,
          zm_ny: 50,
          mw_ny: 50,
        },
        name: translateMarker('Step H'),
        label: translateMarker('Seasonal forecast'),
        type: 'step',
        activities: [],
      },
      {
        page: {
          global_en: 52,
          zm_ny: 54,
          mw_ny: 54,
        },
        name: translateMarker('Step I'),
        label: translateMarker('Response to forecast'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Revisit'),
            svgIcon: 'manual_tool:place_holder',
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
          global_en: 55,
          zm_ny: 57,
          mw_ny: 57,
        },
        name: translateMarker('Step J'),
        label: translateMarker('Short-term forecasts and warnings'),
        type: 'step',
        activities: [],
      },
      {
        page: {
          global_en: 57,
          zm_ny: 59,
          mw_ny: 59,
        },
        name: translateMarker('Step K'),
        label: translateMarker('Response to forecast'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Revisit'),
            svgIcon: 'manual_tool:place_holder',
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
          global_en: 59,
          zm_ny: 61,
          mw_ny: 61,
        },
        name: translateMarker('Step L'),
        label: translateMarker('Learn and improve'),
        type: 'step',
        activities: [
          {
            label: translateMarker('Review'),
            svgIcon: 'manual_tool:place_holder',
            id: 'review-activity',
          },
        ],
      },
    ],
  },
];
