import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import type { IBudgetCard } from '../../schema/cards';

/** Specify available groupings to ensure translations included */
export const ENTERPRISE_GROUPS = {
  crop: translateMarker('crop'),
  livestock: translateMarker('livestock'),
  livelihood: translateMarker('livelihood'),
  fruits: translateMarker('fruits'),
} as const;

// Allow wildcard group type for inputs/outputs that apply to all enterprise groups
export type IEnterpriseGroupType = keyof typeof ENTERPRISE_GROUPS | '*';

const enterprises: Record<IEnterpriseGroupType, { id: string; label: string }[]> = {
  '*': [],
  crop: [
    { label: 'cowpeas', id: 'cowpeas' },
    { label: 'groundnuts', id: 'groundnuts' },
    { label: 'maize', id: 'maize' },
    { label: 'onions', id: 'onions' },
    { label: 'pigeon peas', id: 'pigeon-peas' },
    { label: 'rice', id: 'rice' },
    { label: 'sorghum', id: 'sorghum' },
    { label: 'soya beans', id: 'soya-beans' },
    { label: 'sweet potatoes', id: 'sweet-potatoes' },
    { label: 'tomatoes', id: 'tomatoes' },
  ],
  fruits: [
    { label: 'mixed', id: 'mixed' },
    { label: 'paw-paw', id: 'paw-paw' },
    { label: 'watermelon', id: 'watermelon' },
  ],
  livelihood: [
    { id: 'fish', label: 'fish' },
    { label: 'afforestation', id: 'afforestation' },
    { label: 'beekeeping', id: 'beekeeping' },
    { label: 'brick making', id: 'brick-making' },
    { label: 'casual labour', id: 'casual-labour' },
    { label: 'charcoal', id: 'charcoal' },
    { label: 'firewood', id: 'firewood' },
    { label: 'food selling', id: 'food-selling' },
    { label: 'handicraft', id: 'handicraft' },
    { label: 'retail trading', id: 'retail-trading' },
  ],
  livestock: [
    { label: 'cattle', id: 'cattle' },
    { label: 'chicken', id: 'chicken' },
    { label: 'ducks', id: 'ducks' },
    { label: 'goats', id: 'goats' },
    { label: 'guinea fowl', id: 'guinea-fowl' },
    { label: 'pigs', id: 'pigs' },
    { label: 'sheep', id: 'sheep' },
  ],
};

const ENTERPRISE_CARDS: IBudgetCard[] = [];

for (const [enterpriseGroup, values] of Object.entries(enterprises)) {
  for (const { id, label } of values) {
    ENTERPRISE_CARDS.push({
      id,
      label,
      imgType: 'svg',
      type: 'enterprise',
      groupings: [enterpriseGroup as IEnterpriseGroupType],
    });
  }
}

export default ENTERPRISE_CARDS;
