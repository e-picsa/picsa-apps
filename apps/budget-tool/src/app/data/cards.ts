import { IBudgetCard } from '../models/budget-tool.models';

// This data is automatically populated on first load and update from live when available
const CARDS: IBudgetCard[] = [
  {
    type: 'activities',
    grouping: '',
    label: 'apply fertiliser',
    id: 'apply-fertiliser'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'apply pesticide',
    id: 'apply-pesticide'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'compost manure making',
    id: 'compost-manure-making'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'feeding livestock',
    id: 'feeding-livestock'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'harvesting',
    id: 'harvesting'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'land clearing',
    id: 'land-clearing'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'marketing',
    id: 'marketing'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'mulching',
    id: 'mulching'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'none',
    id: 'none'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'other',
    id: 'other'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'plough',
    id: 'plough'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'post-harvest handling',
    id: 'post-harvest-handling'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'sow',
    id: 'sow'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'storage',
    id: 'storage'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'threshing',
    id: 'threshing'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'top dressing - fertiliser',
    id: 'top-dressing---fertiliser'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'transport',
    id: 'transport'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'value addition',
    id: 'value-addition'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'water',
    id: 'water'
  },
  {
    type: 'activities',
    grouping: '',
    label: 'weeding',
    id: 'weeding'
  },
  {
    type: 'produceConsumed',
    grouping: '',
    label: 'crop',
    id: 'crop'
  },
  {
    type: 'produceConsumed',
    grouping: '',
    label: 'eggs',
    id: 'eggs'
  },
  {
    type: 'produceConsumed',
    grouping: '',
    label: 'honey',
    id: 'honey'
  },
  {
    type: 'produceConsumed',
    grouping: '',
    label: 'meat',
    id: 'meat'
  },
  {
    type: 'produceConsumed',
    grouping: '',
    label: 'milk',
    id: 'milk'
  },
  {
    type: 'produceConsumed',
    grouping: '',
    label: 'money',
    id: 'money'
  },
  {
    type: 'produceConsumed',
    grouping: '',
    label: 'none',
    id: 'none'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'beehive',
    id: 'beehive'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'feed',
    id: 'feed'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'fertiliser',
    id: 'fertiliser'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'firewood',
    id: 'firewood'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'hire ox cart',
    id: 'hire-ox-cart'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'hired labour',
    id: 'hired-labour'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'labour',
    id: 'labour'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'none',
    id: 'none'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'other',
    id: 'other'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'pot for storage',
    id: 'pot-for-storage'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'protective equipment',
    id: 'protective-equipment'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'purchase ox cart',
    id: 'purchase-ox-cart'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'purchasing sacks for harvest',
    id: 'purchasing-sacks-for-harvest'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'sacks of manure',
    id: 'sacks-of-manure'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'seeds',
    id: 'seeds'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'tools',
    id: 'tools'
  },
  {
    type: 'inputs',
    grouping: '',
    label: 'wheelbarrows of manure',
    id: 'wheelbarrows-of-manure'
  },
  {
    type: 'outputs',
    grouping: '',
    label: 'crop',
    id: 'crop'
  },
  {
    type: 'outputs',
    grouping: '',
    label: 'eggs',
    id: 'eggs'
  },
  {
    type: 'outputs',
    grouping: '',
    label: 'fodder for livestock',
    id: 'fodder-for-livestock'
  },
  {
    type: 'outputs',
    grouping: '',
    label: 'honey',
    id: 'honey'
  },
  {
    type: 'outputs',
    grouping: '',
    label: 'manure for compost',
    id: 'manure-for-compost'
  },
  {
    type: 'outputs',
    grouping: '',
    label: 'meat',
    id: 'meat'
  },
  {
    type: 'outputs',
    grouping: '',
    label: 'milk',
    id: 'milk'
  },
  {
    type: 'outputs',
    grouping: '',
    label: 'money',
    id: 'money'
  },
  {
    type: 'outputs',
    grouping: '',
    label: 'none',
    id: 'none'
  },
  {
    type: 'outputs',
    grouping: '',
    label: 'other',
    id: 'other'
  },
  {
    type: 'outputs',
    grouping: '',
    label: 'pots',
    id: 'pots'
  },
  {
    type: 'enterprise',
    grouping: 'afforestation',
    label: 'afforestation',
    id: 'afforestation'
  },
  {
    type: 'enterprise',
    grouping: 'crop',
    label: 'groundnuts',
    id: 'groundnuts'
  },
  {
    type: 'enterprise',
    grouping: 'crop',
    label: 'maize',
    id: 'maize'
  },
  {
    type: 'enterprise',
    grouping: 'crop',
    label: 'pigeon peas',
    id: 'pigeon-peas'
  },
  {
    type: 'enterprise',
    grouping: 'crop',
    label: 'rice',
    id: 'rice'
  },
  {
    type: 'enterprise',
    grouping: 'crop',
    label: 'sorghum',
    id: 'sorghum'
  },
  {
    type: 'enterprise',
    grouping: 'crop',
    label: 'sweet potatoes',
    id: 'sweet-potatoes'
  },
  {
    type: 'enterprise',
    grouping: 'fish',
    label: 'fish',
    id: 'fish'
  },
  {
    type: 'enterprise',
    grouping: 'fish',
    label: 'fishing',
    id: 'fishing'
  },
  {
    type: 'enterprise',
    grouping: 'fruits',
    label: 'avocado pears',
    id: 'avocado-pears'
  },
  {
    type: 'enterprise',
    grouping: 'fruits',
    label: 'melons and pumpkins',
    id: 'melons-and-pumpkins'
  },
  {
    type: 'enterprise',
    grouping: 'fruits',
    label: 'mushrooms',
    id: 'mushrooms'
  },
  {
    type: 'enterprise',
    grouping: 'fruits',
    label: 'wild fruits',
    id: 'wild-fruits'
  },
  {
    type: 'enterprise',
    grouping: 'crop',
    label: 'soya beans',
    id: 'soya-beans'
  },
  {
    type: 'enterprise',
    grouping: 'crop',
    label: 'cowpeas',
    id: 'cowpeas'
  },
  {
    type: 'enterprise',
    grouping: 'fruits',
    label: 'paw-paw',
    id: 'paw-paw'
  },
  {
    type: 'enterprise',
    grouping: 'fruits',
    label: 'watermelon',
    id: 'watermelon'
  },
  {
    type: 'enterprise',
    grouping: 'fruits',
    label: 'mixed',
    id: 'mixed'
  },
  {
    type: 'enterprise',
    grouping: 'livestock',
    label: 'cattle',
    id: 'cattle'
  },
  {
    type: 'enterprise',
    grouping: 'livestock',
    label: 'goats',
    id: 'goats'
  },
  {
    type: 'enterprise',
    grouping: 'livestock',
    label: 'sheep',
    id: 'sheep'
  },
  {
    type: 'enterprise',
    grouping: 'livestock',
    label: 'ducks',
    id: 'ducks'
  },
  {
    type: 'enterprise',
    grouping: 'livestock',
    label: 'chicken',
    id: 'chicken'
  },
  {
    type: 'enterprise',
    grouping: 'livestock',
    label: 'guinea fowl',
    id: 'guinea-fowl'
  },
  {
    type: 'enterprise',
    grouping: 'livestock',
    label: 'pigs',
    id: 'pigs'
  }
];

export default CARDS;
