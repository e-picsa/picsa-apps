import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IManualPeriodEntry } from '../../models';

/** Picsa manual contents organised by section and step */

export const PICSA_MANUAL_CONTENTS_FARMER: IManualPeriodEntry[] = [
  {
    label: translateMarker('PICSA'),
    steps: [
      {
        page: {
          global_en: 2,
          zm_ny: 7,
          mw_ny: 7,
          zm_bem: 2,
          zm_loz: 2,
          zm_lun: 2,
          zm_lue: 2,
          zm_toi: 2,
        },
        name: '',
        label: translateMarker('Introduction'),
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
          global_en: 6,
          zm_ny: 11,
          mw_ny: 11,
          zm_bem: 6,
          zm_loz: 6,
          zm_lun: 6,
          zm_lue: 6,
          zm_toi: 6,
        },
        name: translateMarker('A'),
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
          global_en: 10,
          zm_ny: 17,
          mw_ny: 17,
          zm_bem: 10,
          zm_loz: 10,
          zm_lun: 11,
          zm_lue: 12,
          zm_toi: 11,
        },
        name: translateMarker('B'),
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
          global_en: 12,
          zm_ny: 20,
          mw_ny: 20,
          zm_bem: 13,
          zm_loz: 13,
          zm_lun: 13,
          zm_lue: 15,
          zm_toi: 14,
        },
        name: translateMarker('C'),
        label: translateMarker('What are the opportunities and risks?'),
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
          global_en: 14,
          zm_ny: 23,
          mw_ny: 23,
          zm_bem: 15,
          zm_loz: 15,
          zm_lun: 15,
          zm_lue: 17,
          zm_toi: 16,
        },
        name: translateMarker('D'),
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
          global_en: 16,
          zm_ny: 26,
          mw_ny: 26,
          zm_bem: 17,
          zm_loz: 17,
          zm_lun: 17,
          zm_lue: 19,
          zm_toi: 18,
        },
        name: translateMarker('E'),
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
          global_en: 17,
          zm_ny: 27,
          mw_ny: 27,
          zm_bem: 18,
          zm_loz: 18,
          zm_lun: 18,
          zm_lue: 20,
          zm_toi: 19,
        },
        name: translateMarker('F'),
        label: translateMarker('Comparing different options and planning using Participatory Budgets'),
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
          global_en: 19,
          zm_ny: 30,
          mw_ny: 30,
          zm_bem: 20,
          zm_loz: 19,
          zm_lun: 20,
          zm_lue: 23,
          zm_toi: 21,
        },
        name: translateMarker('G'),
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
          global_en: 20,
          zm_ny: -1,
          mw_ny: -1,
          zm_bem: 21,
          zm_loz: 21,
          zm_lun: 23,
          zm_lue: 24,
          zm_toi: 21,
        },
        name: translateMarker('H'),
        label: translateMarker('Seasonal forecast'),
        type: 'step',
        activities: [],
      },
      {
        page: {
          global_en: 21,
          zm_ny: -1,
          mw_ny: -1,
          zm_bem: 22,
          zm_loz: 22,
          zm_lun: 23,
          zm_lue: 26,
          zm_toi: 23,
        },
        name: translateMarker('I'),
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
          global_en: 22,
          zm_ny: -1,
          mw_ny: -1,
          zm_bem: 23,
          zm_loz: 23,
          zm_lun: 24,
          zm_lue: 27,
          zm_toi: 24,
        },
        name: translateMarker('J'),
        label: translateMarker('Short-term forecasts and warnings'),
        type: 'step',
        activities: [],
      },
      {
        page: {
          global_en: 23,
          zm_ny: -1,
          mw_ny: -1,
          zm_bem: 26,
          zm_loz: 24,
          zm_lun: 25,
          zm_lue: 29,
          zm_toi: 26,
        },
        name: translateMarker('K'),
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
          global_en: 24,
          zm_ny: -1,
          mw_ny: -1,
          zm_bem: 27,
          zm_loz: 25,
          zm_lun: 26,
          zm_lue: 30,
          zm_toi: 27,
        },
        name: translateMarker('L'),
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
