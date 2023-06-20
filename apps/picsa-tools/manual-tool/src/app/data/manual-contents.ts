import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

interface IManualListEntry {
  label: string;
  children: {
    name: string;
    label: string;
    type: 'step';
    children: IManualActivity[];
  }[];
}

interface IManualActivity {
  label: string;
  link: string;
  icon: string;
}

/** Picsa manual contents organised by section and step */
export const PICSA_MANUAL_LIST_DATA: IManualListEntry[] = [
  {
    label: translateMarker('Long before the season'),
    children: [
      {
        name: translateMarker('Step A'),
        label: translateMarker('What does the farmer currently do?'),
        type: 'step',
        children: [
          {
            label: translateMarker('Resource Allocation Map (RAM)'),
            link: '/ram',
            icon: 'picsa_manual_resource_allocation',
          },
          {
            label: translateMarker('Seasonal Calendar'),
            link: '/seasonal-calendar',
            icon: 'picsa_manual_calender',
          },
        ],
      },
      {
        name: translateMarker('Step B'),
        label: translateMarker('Is the climate changing?'),
        type: 'step',
        children: [
          {
            label: translateMarker('Historic climate'),
            link: '/historic-climate',
            icon: 'picsa_manual_temperature',
          },
        ],
      },
      {
        name: translateMarker('Step C'),
        label: translateMarker('What are the probabilities and risks?'),
        type: 'step',
        children: [
          {
            label: translateMarker('Probability and Risk'),
            link: '/probability-and-risk',
            icon: 'picsa_manual_campus',
          },
        ],
      },
      {
        name: translateMarker('Step D'),
        label: translateMarker('What are the options for the farmer?'),
        type: 'step',
        children: [
          {
            label: translateMarker('Crop Info'),
            link: '/crop-info',
            icon: 'picsa_manual_crop',
          },
          {
            label: translateMarker('Livestock Info'),
            link: '/livestock-info',
            icon: 'picsa_manual_livestock',
          },
          {
            label: translateMarker('Livelihood Info'),
            link: '/livelihood-info',
            icon: 'picsa_manual_place_holder',
          },
        ],
      },
      {
        name: translateMarker('Step E'),
        label: translateMarker('Options by context'),
        type: 'step',
        children: [
          {
            label: translateMarker('Farmers choose'),
            link: '/farmers-choose',
            icon: 'picsa_manual_place_holder',
          },
        ],
      },
      {
        name: translateMarker('Step F'),
        label: translateMarker('Compare different options and plans'),
        type: 'step',
        children: [
          {
            label: translateMarker('Budget'),
            link: '/budget',
            icon: 'picsa_manual_place_holder',
          },
        ],
      },
      {
        name: translateMarker('Step G'),
        label: translateMarker('The farmer decides'),
        type: 'step',
        children: [
          {
            label: translateMarker('Select and amend'),
            link: '/select-and-amend',
            icon: 'picsa_manual_place_holder',
          },
        ],
      },
    ],
  },
  {
    label: translateMarker('Just before the season'),
    children: [
      {
        name: translateMarker('Step H'),
        label: translateMarker('Seasonal forecast'),
        type: 'step',
        children: [],
      },
      {
        name: translateMarker('Step I'),
        label: translateMarker('Response to forecast'),
        type: 'step',
        children: [
          {
            label: translateMarker('Revisit'),
            link: '/revisit',
            icon: 'picsa_manual_place_holder',
          },
        ],
      },
    ],
  },
  {
    label: translateMarker('During the season'),
    children: [
      {
        name: translateMarker('Step J'),
        label: translateMarker('Short-term forecasts and warnings'),
        type: 'step',
        children: [],
      },
      {
        name: translateMarker('Step K'),
        label: translateMarker('Response to forecast'),
        type: 'step',
        children: [
          {
            label: translateMarker('Revisit'),
            link: '/revisit',
            icon: 'picsa_manual_place_holder',
          },
        ],
      },
    ],
  },
  {
    label: translateMarker('After the season'),
    children: [
      {
        name: translateMarker('Step L'),
        label: translateMarker('Learn and improve'),
        type: 'step',
        children: [
          {
            label: translateMarker('Review'),
            link: '/review',
            icon: 'picsa_manual_place_holder',
          },
        ],
      },
    ],
  },
];

/** Picsa manual contents organised by section only */
const PICSA_MANUAL_GRID_DATA: IManualActivity[] = [];

for (const period of PICSA_MANUAL_LIST_DATA) {
  for (const step of period.children) {
    for (const item of step.children) {
      PICSA_MANUAL_GRID_DATA.push(item);
    }
  }
}

export { PICSA_MANUAL_GRID_DATA };
