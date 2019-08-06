import { IBudgetCard } from '../models/budget-tool.models';

// This data is automatically populated on first load and update from live when available
const CARDS: IBudgetCard[] = [
  {
    type: 'activities',
    label: 'apply fertiliser',
    id: 'apply-fertiliser',
    groupings: ['crop']
  },
  {
    type: 'activities',
    label: 'apply pesticide',
    id: 'apply-pesticide',
    groupings: ['crop']
  },
  {
    type: 'activities',
    label: 'bagging',
    id: 'bagging',
    groupings: ['crop']
  },
  {
    type: 'activities',
    label: 'compost manure making',
    id: 'compost-manure-making',
    groupings: ['crop']
  },
  {
    type: 'activities',
    label: 'feeding livestock',
    id: 'feeding-livestock',
    groupings: ['livestock']
  },
  {
    type: 'activities',
    label: 'harvesting',
    id: 'harvesting',
    groupings: ['crop']
  },
  {
    type: 'activities',
    label: 'land clearing',
    id: 'land-clearing',
    groupings: ['crop']
  },
  {
    type: 'activities',
    label: 'marketing and selling',
    id: 'marketing-and-selling',
    groupings: ['crop', 'livestock']
  },
  {
    type: 'activities',
    label: 'mulching',
    id: 'mulching',
    groupings: ['crop']
  },
  {
    type: 'activities',
    label: 'ploughing',
    id: 'ploughing',
    groupings: ['crop']
  },
  {
    type: 'activities',
    label: 'post-harvest handling',
    id: 'post-harvest-handling',
    groupings: ['crop']
  },
  {
    type: 'activities',
    label: 'shelling',
    id: 'shelling',
    groupings: ['crop']
  },
  { type: 'activities', label: 'sowing', id: 'sowing', groupings: ['crop'] },
  {
    type: 'activities',
    label: 'storage',
    id: 'storage',
    groupings: ['crop']
  },
  {
    type: 'activities',
    label: 'threshing',
    id: 'threshing',
    groupings: ['crop']
  },
  {
    type: 'activities',
    label: 'top dressing - fertiliser',
    id: 'top-dressing---fertiliser',
    groupings: ['crop']
  },
  {
    type: 'activities',
    label: 'transport',
    id: 'transport',
    groupings: ['crop']
  },
  {
    type: 'activities',
    label: 'value addition',
    id: 'value-addition',
    groupings: ['crop']
  },
  {
    type: 'activities',
    label: 'watering',
    id: 'watering',
    groupings: ['crop']
  },
  {
    type: 'activities',
    label: 'weeding',
    id: 'weeding',
    groupings: ['crop']
  },
  {
    type: 'enterprise',
    label: 'afforestation',
    id: 'afforestation',
    groupings: ['afforestation']
  },
  {
    type: 'enterprise',
    label: 'cattle',
    id: 'cattle',
    groupings: ['livestock']
  },
  {
    type: 'enterprise',
    label: 'chicken',
    id: 'chicken',
    groupings: ['livestock']
  },
  {
    type: 'enterprise',
    label: 'cowpeas',
    id: 'cowpeas',
    groupings: ['crop']
  },
  {
    type: 'enterprise',
    label: 'ducks',
    id: 'ducks',
    groupings: ['livestock']
  },
  { type: 'enterprise', label: 'fish', id: 'fish', groupings: ['fish'] },
  {
    type: 'enterprise',
    label: 'goats',
    id: 'goats',
    groupings: ['livestock']
  },
  {
    type: 'enterprise',
    label: 'groundnuts',
    id: 'groundnuts',
    groupings: ['crop']
  },
  {
    type: 'enterprise',
    label: 'guinea fowl',
    id: 'guinea-fowl',
    groupings: ['livestock']
  },
  { type: 'enterprise', label: 'maize', id: 'maize', groupings: ['crop'] },
  { type: 'enterprise', label: 'mixed', id: 'mixed', groupings: ['fruits'] },
  {
    type: 'enterprise',
    label: 'paw-paw',
    id: 'paw-paw',
    groupings: ['fruits']
  },
  {
    type: 'enterprise',
    label: 'pigeon peas',
    id: 'pigeon-peas',
    groupings: ['crop']
  },
  { type: 'enterprise', label: 'pigs', id: 'pigs', groupings: ['livestock'] },
  { type: 'enterprise', label: 'rice', id: 'rice', groupings: ['crop'] },
  {
    type: 'enterprise',
    label: 'sheep',
    id: 'sheep',
    groupings: ['livestock']
  },
  {
    type: 'enterprise',
    label: 'sorghum',
    id: 'sorghum',
    groupings: ['crop']
  },
  {
    type: 'enterprise',
    label: 'soya beans',
    id: 'soya-beans',
    groupings: ['crop']
  },
  {
    type: 'enterprise',
    label: 'sweet potatoes',
    id: 'sweet-potatoes',
    groupings: ['crop']
  },
  {
    type: 'enterprise',
    label: 'watermelon',
    id: 'watermelon',
    groupings: ['fruits']
  },
  { type: 'inputs', label: 'bags', id: 'bags', groupings: ['livestock'] },
  {
    type: 'inputs',
    label: 'chemicals',
    id: 'chemicals',
    groupings: ['crop']
  },
  { type: 'inputs', label: 'feed', id: 'feed', groupings: ['livestock'] },
  {
    type: 'inputs',
    label: 'fertiliser',
    id: 'fertiliser',
    groupings: ['crop']
  },
  { type: 'inputs', label: 'firewood', id: 'firewood', groupings: ['crop'] },
  {
    type: 'inputs',
    label: 'hire ox cart',
    id: 'hire-ox-cart',
    groupings: ['crop']
  },
  {
    type: 'inputs',
    label: 'labour - paid',
    id: 'labour---paid',
    groupings: ['crop', 'livestock']
  },
  {
    type: 'inputs',
    label: 'manure sacks',
    id: 'manure-sacks',
    groupings: ['crop']
  },
  {
    type: 'inputs',
    label: 'manure wheelbarrows',
    id: 'manure-wheelbarrows',
    groupings: ['crop']
  },
  {
    type: 'inputs',
    label: 'pot for storage',
    id: 'pot-for-storage',
    groupings: ['crop']
  },
  {
    type: 'inputs',
    label: 'protective equipment',
    id: 'protective-equipment',
    groupings: ['crop']
  },
  {
    type: 'inputs',
    label: 'purchase ox cart',
    id: 'purchase-ox-cart',
    groupings: ['crop']
  },
  { type: 'inputs', label: 'seeds', id: 'seeds', groupings: ['crop'] },
  {
    type: 'inputs',
    label: 'sheller hire',
    id: 'sheller-hire',
    groupings: ['crop']
  },
  { type: 'inputs', label: 'tools', id: 'tools', groupings: ['crop'] },
  {
    type: 'inputs',
    label: 'tractor hire',
    id: 'tractor-hire',
    groupings: ['crop']
  },
  {
    type: 'inputs',
    label: 'transportation hire',
    id: 'transportation-hire',
    groupings: ['crop', 'livestock']
  },
  { type: 'outputs', label: 'crop', id: 'crop', groupings: ['crop'] },
  { type: 'outputs', label: 'eggs', id: 'eggs', groupings: ['livestock'] },
  {
    type: 'outputs',
    label: 'fodder for livestock',
    id: 'fodder-for-livestock',
    groupings: ['livestock']
  },
  {
    type: 'outputs',
    label: 'manure for compost',
    id: 'manure-for-compost',
    groupings: ['livestock']
  },
  { type: 'outputs', label: 'meat', id: 'meat', groupings: ['livestock'] },
  { type: 'outputs', label: 'milk', id: 'milk', groupings: ['livestock'] },
  { type: 'outputs', label: 'money', id: 'money', groupings: ['crop'] },
  { type: 'outputs', label: 'pots', id: 'pots', groupings: ['crop'] },
  { type: 'outputs', label: 'wood', id: 'wood', groupings: ['crop'] },
  { type: 'produceConsumed', label: 'crop', id: 'crop', groupings: ['crop'] },
  {
    type: 'produceConsumed',
    label: 'eggs',
    id: 'eggs',
    groupings: ['livestock']
  },
  {
    type: 'produceConsumed',
    label: 'meat',
    id: 'meat',
    groupings: ['livestock']
  },
  {
    type: 'produceConsumed',
    label: 'milk',
    id: 'milk',
    groupings: ['livestock']
  },
  {
    type: 'produceConsumed',
    label: 'money',
    id: 'money',
    groupings: ['crop']
  }
];

export default CARDS;
