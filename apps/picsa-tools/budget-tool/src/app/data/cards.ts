import { IBudgetCard } from '../models/budget-tool.models';

// This data is automatically populated on first load and update from live when available
const CARDS: IBudgetCard[] = [
  {
    type: 'activities',
    label: 'build housing',
    id: 'build-housing',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'enterprise',
    label: 'cattle',
    id: 'cattle',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'enterprise',
    label: 'chicken',
    id: 'chicken',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'dipping',
    id: 'dipping',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'enterprise',
    label: 'ducks',
    id: 'ducks',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'outputs',
    label: 'eggs',
    id: 'eggs',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'inputs',
    label: 'feed',
    id: 'feed',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'feeding livestock',
    id: 'feeding-livestock',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'outputs',
    label: 'fodder for livestock',
    id: 'fodder-for-livestock',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'enterprise',
    label: 'goats',
    id: 'goats',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'enterprise',
    label: 'guinea fowl',
    id: 'guinea-fowl',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'inputs',
    label: 'housing',
    id: 'housing',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'outputs',
    label: 'manure for compost',
    id: 'manure-for-compost',
    groupings: ['livestock'],
    imgType: 'png'
  },
  {
    type: 'outputs',
    label: 'meat',
    id: 'meat',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'outputs',
    label: 'milk',
    id: 'milk',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'enterprise',
    label: 'pigs',
    id: 'pigs',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'provide supplements',
    id: 'provide-supplements',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'provide water',
    id: 'provide-water',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'relocation',
    id: 'relocation',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'enterprise',
    label: 'sheep',
    id: 'sheep',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'inputs',
    label: 'supplements',
    id: 'supplements',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'transport livestock',
    id: 'transport-livestock',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'vaccinate',
    id: 'vaccinate',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'inputs',
    label: 'vaccine',
    id: 'vaccine',
    groupings: ['livestock'],
    imgType: 'svg'
  },
  {
    type: 'inputs',
    label: 'bags',
    id: 'bags',
    groupings: ['livestock', 'crops'],
    imgType: 'png'
  },
  {
    type: 'enterprise',
    label: 'mixed',
    id: 'mixed',
    groupings: ['fruits'],
    imgType: 'svg'
  },
  {
    type: 'enterprise',
    label: 'paw-paw',
    id: 'paw-paw',
    groupings: ['fruits'],
    imgType: 'svg'
  },
  {
    type: 'enterprise',
    label: 'watermelon',
    id: 'watermelon',
    groupings: ['fruits'],
    imgType: 'svg'
  },
  {
    type: 'enterprise',
    label: 'fish',
    id: 'fish',
    groupings: ['fish'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'apply fertiliser',
    id: 'apply-fertiliser',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'activities',
    label: 'apply pesticide',
    id: 'apply-pesticide',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'activities',
    label: 'bagging',
    id: 'bagging',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'activities',
    label: 'banding',
    id: 'banding',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'inputs',
    label: 'chemicals',
    id: 'chemicals',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'compost manure making',
    id: 'compost-manure-making',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'enterprise',
    label: 'cowpeas',
    id: 'cowpeas',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'outputs',
    label: 'crop',
    id: 'crop',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'inputs',
    label: 'fertiliser',
    id: 'fertiliser',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'enterprise',
    label: 'groundnuts',
    id: 'groundnuts',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'harvesting',
    id: 'harvesting',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'activities',
    label: 'land clearing',
    id: 'land-clearing',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'enterprise',
    label: 'maize',
    id: 'maize',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'inputs',
    label: 'manure sacks',
    id: 'manure-sacks',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'inputs',
    label: 'manure wheelbarrows',
    id: 'manure-wheelbarrows',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'activities',
    label: 'mulching',
    id: 'mulching',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'enterprise',
    label: 'onions',
    id: 'onions',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'inputs',
    label: 'ox cart',
    id: 'ox-cart',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'enterprise',
    label: 'pigeon peas',
    id: 'pigeon-peas',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'ploughing',
    id: 'ploughing',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'activities',
    label: 'post-harvest handling',
    id: 'post-harvest-handling',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'inputs',
    label: 'pot for storage',
    id: 'pot-for-storage',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'inputs',
    label: 'protective equipment',
    id: 'protective-equipment',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'enterprise',
    label: 'rice',
    id: 'rice',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'inputs',
    label: 'seeds',
    id: 'seeds',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'inputs',
    label: 'sheller hire',
    id: 'sheller-hire',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'activities',
    label: 'shelling',
    id: 'shelling',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'enterprise',
    label: 'sorghum',
    id: 'sorghum',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'sowing',
    id: 'sowing',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'enterprise',
    label: 'soya beans',
    id: 'soya-beans',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'storage',
    id: 'storage',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'enterprise',
    label: 'sweet potatoes',
    id: 'sweet-potatoes',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'threshing',
    id: 'threshing',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'enterprise',
    label: 'tomatoes',
    id: 'tomatoes',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'inputs',
    label: 'tools',
    id: 'tools',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'inputs',
    label: 'tractor hire',
    id: 'tractor-hire',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'activities',
    label: 'transport',
    id: 'transport',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'activities',
    label: 'watering',
    id: 'watering',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'activities',
    label: 'weeding',
    id: 'weeding',
    groupings: ['crop'],
    imgType: 'png'
  },
  {
    type: 'inputs',
    label: 'wood',
    id: 'wood',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'outputs',
    label: 'wood',
    id: 'wood',
    groupings: ['crop'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'marketing and selling',
    id: 'marketing-and-selling',
    groupings: ['crop', 'livestock'],
    imgType: 'png'
  },
  {
    type: 'inputs',
    label: 'transportation hire',
    id: 'transportation-hire',
    groupings: ['crop', 'livestock'],
    imgType: 'svg'
  },
  {
    type: 'inputs',
    label: 'money',
    id: 'money',
    groupings: ['*'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'value addition',
    id: 'value-addition',
    groupings: ['crop', 'livestock'],
    imgType: 'png'
  },
  {
    type: 'inputs',
    label: 'labour - paid',
    id: 'labour---paid',
    groupings: ['crop', 'livestock'],
    imgType: 'png'
  },
  {
    type: 'enterprise',
    label: 'afforestation',
    id: 'afforestation',
    groupings: ['afforestation'],
    imgType: 'svg'
  },
  {
    type: 'other',
    label: 'add custom',
    id: 'add-custom',
    groupings: [],
    imgType: 'svg'
  },
  {
    type: 'other',
    label: 'family labour',
    id: 'family-labour',
    groupings: [],
    imgType: 'svg'
  },
  {
    type: 'outputs',
    label: 'money',
    id: 'money',
    groupings: ['*'],
    imgType: 'svg'
  },
  {
    type: 'activities',
    label: 'purchase',
    id: 'purchase',
    groupings: ['livestock'],
    imgType: 'svg'
  }
];
export default CARDS;
