import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import type { IBudgetCard } from '../../schema/cards';

/** Specify available groupings to ensure translations included */
export const ENTERPRISE_GROUPS = {
  crop: translateMarker('crop'),
  livestock: translateMarker('livestock'),
  livelihood: translateMarker('livelihood'),
  fruits: translateMarker('fruits'),
  fish: translateMarker('fish'),
  afforestation: translateMarker('afforestation'),
} as const;

// Allow wildcard group type for inputs/outputs that apply to all enterprise groups
export type IEnterpriseGroupType = keyof typeof ENTERPRISE_GROUPS | '*';

export const ENTERPRISE_CARDS: IBudgetCard[] = [
  // todo - ADD specific LIVELIHOOD options with cards
  {
    type: 'enterprise',
    label: 'livelihood',
    id: 'livelihood',
    groupings: ['livelihood'],
    imgType: 'svg',
  },
  {
    type: 'enterprise',
    label: 'cattle',
    id: 'cattle',
    groupings: ['livestock'],
    imgType: 'svg',
  },
  {
    type: 'enterprise',
    label: 'chicken',
    id: 'chicken',
    groupings: ['livestock'],
    imgType: 'svg',
  },

  {
    type: 'enterprise',
    label: 'ducks',
    id: 'ducks',
    groupings: ['livestock'],
    imgType: 'svg',
  },

  {
    type: 'enterprise',
    label: 'goats',
    id: 'goats',
    groupings: ['livestock'],
    imgType: 'svg',
  },
  {
    type: 'enterprise',
    label: 'guinea fowl',
    id: 'guinea-fowl',
    groupings: ['livestock'],
    imgType: 'svg',
  },

  {
    type: 'enterprise',
    label: 'pigs',
    id: 'pigs',
    groupings: ['livestock'],
    imgType: 'svg',
  },

  {
    type: 'enterprise',
    label: 'sheep',
    id: 'sheep',
    groupings: ['livestock'],
    imgType: 'svg',
  },

  {
    type: 'enterprise',
    label: 'mixed',
    id: 'mixed',
    groupings: ['fruits'],
    imgType: 'svg',
  },
  {
    type: 'enterprise',
    label: 'paw-paw',
    id: 'paw-paw',
    groupings: ['fruits'],
    imgType: 'svg',
  },
  {
    type: 'enterprise',
    label: 'watermelon',
    id: 'watermelon',
    groupings: ['fruits'],
    imgType: 'svg',
  },
  {
    type: 'enterprise',
    label: 'fish',
    id: 'fish',
    groupings: ['fish'],
    imgType: 'svg',
  },

  {
    type: 'enterprise',
    label: 'cowpeas',
    id: 'cowpeas',
    groupings: ['crop'],
    imgType: 'svg',
  },

  {
    type: 'enterprise',
    label: 'groundnuts',
    id: 'groundnuts',
    groupings: ['crop'],
    imgType: 'svg',
  },

  {
    type: 'enterprise',
    label: 'maize',
    id: 'maize',
    groupings: ['crop'],
    imgType: 'svg',
  },

  {
    type: 'enterprise',
    label: 'onions',
    id: 'onions',
    groupings: ['crop'],
    imgType: 'svg',
  },

  {
    type: 'enterprise',
    label: 'pigeon peas',
    id: 'pigeon-peas',
    groupings: ['crop'],
    imgType: 'svg',
  },

  {
    type: 'enterprise',
    label: 'rice',
    id: 'rice',
    groupings: ['crop'],
    imgType: 'svg',
  },

  {
    type: 'enterprise',
    label: 'sorghum',
    id: 'sorghum',
    groupings: ['crop'],
    imgType: 'svg',
  },

  {
    type: 'enterprise',
    label: 'soya beans',
    id: 'soya-beans',
    groupings: ['crop'],
    imgType: 'svg',
  },

  {
    type: 'enterprise',
    label: 'sweet potatoes',
    id: 'sweet-potatoes',
    groupings: ['crop'],
    imgType: 'svg',
  },

  {
    type: 'enterprise',
    label: 'tomatoes',
    id: 'tomatoes',
    groupings: ['crop'],
    imgType: 'svg',
  },

  {
    type: 'enterprise',
    label: 'afforestation',
    id: 'afforestation',
    groupings: ['afforestation'],
    imgType: 'svg',
  },
];
export default ENTERPRISE_CARDS;
