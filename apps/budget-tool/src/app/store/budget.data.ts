import { IBudgetMeta } from '../models/budget-tool.models';

// This data is automatically populated on first load and update from live when available
export const BUDGET_DATA: IBudgetMeta = {
  activities: [
    {
      name: 'apply fertiliser',
      id: 'apply-fertiliser'
    },
    {
      name: 'apply pesticide',
      id: 'apply-pesticide'
    },
    {
      name: 'bagging',
      id: 'bagging'
    },
    {
      name: 'compost manure making',
      id: 'compost-manure-making'
    },
    {
      name: 'harvesting',
      id: 'harvesting'
    },
    {
      name: 'land clearing',
      id: 'land-clearing'
    },
    {
      name: 'marketing and selling',
      id: 'marketing-and-selling'
    },
    {
      name: 'mulching',
      id: 'mulching'
    },
    {
      name: 'ploughing',
      id: 'ploughing'
    },
    {
      name: 'shelling',
      id: 'shelling'
    },
    {
      name: 'sowing',
      id: 'sowing'
    },
    {
      name: 'storage',
      id: 'storage'
    },
    {
      name: 'threshing',
      id: 'threshing'
    },
    {
      name: 'transport',
      id: 'transport'
    },
    {
      name: 'watering',
      id: 'watering'
    },
    {
      name: 'weeding',
      id: 'weeding'
    }
  ],
  inputs: [
    {
      name: 'bags',
      id: 'bags'
    },
    {
      name: 'chemicals',
      id: 'chemicals'
    },
    {
      name: 'fertiliser',
      id: 'fertiliser'
    },
    {
      name: 'hire ox cart',
      id: 'hire-ox-cart'
    },
    {
      name: 'labour - paid',
      id: 'labour---paid'
    },
    {
      name: 'manure sacks',
      id: 'manure-sacks'
    },
    {
      name: 'manure wheelbarrows',
      id: 'manure-wheelbarrows'
    },
    {
      name: 'pot for storagePrvdr',
      id: 'pot-for-storagePrvdr'
    },
    {
      name: 'protective equipment',
      id: 'protective-equipment'
    },
    {
      name: 'seeds',
      id: 'seeds'
    },
    {
      name: 'sheller hire',
      id: 'sheller-hire'
    },
    {
      name: 'tools',
      id: 'tools'
    },
    {
      name: 'tractor hire',
      id: 'tractor-hire'
    },
    {
      name: 'transportation hire',
      id: 'transportation-hire'
    },
    {
      name: 'wood',
      id: 'wood'
    }
  ],
  outputs: [
    {
      name: 'crop',
      id: 'crop'
    },
    {
      name: 'manure for compost',
      id: 'manure-for-compost'
    },
    {
      name: 'money',
      id: 'money'
    },
    {
      name: 'wood',
      id: 'wood'
    }
  ],
  familyLabour: [{ name: 'family labour', id: 'family-labour' }],
  enterpriseTypes: ['crop', 'fish', 'fruits', 'livestock'],
  enterprises: [
    { type: 'crop', name: 'maize', id: 'maize' },
    { type: 'crop', name: 'rice', id: 'rice' },
    { type: 'crop', name: 'beans', id: 'beans' },
    { type: 'crop', name: 'soya beans', id: 'soya-beans' },
    { type: 'crop', name: 'groundnuts', id: 'groundnuts' },
    { type: 'crop', name: 'pigeon peas', id: 'pigeon-peas' },
    { type: 'crop', name: 'cowpeas', id: 'cowpeas' },
    { type: 'crop', name: 'sweet potatoes', id: 'sweet-potatoes' },
    { type: 'crop', name: 'sorghum', id: 'sorghum' },
    { type: 'fish', name: 'fish', id: 'fish' },
    { type: 'fruits', name: 'avocado', id: 'avocado' },
    { type: 'fruits', name: 'mangoes', id: 'mangoes' },
    { type: 'fruits', name: 'paw-paw', id: 'paw-paw' },
    { type: 'fruits', name: 'watermelon', id: 'watermelon' },
    { type: 'fruits', name: 'mixed', id: 'mixed' },
    { type: 'fruits', name: 'pumpkins', id: 'pumpkins' },
    { type: 'livestock', name: 'cattle', id: 'cattle' },
    { type: 'livestock', name: 'goats', id: 'goats' },
    { type: 'livestock', name: 'sheep', id: 'sheep' },
    { type: 'livestock', name: 'ducks', id: 'ducks' },
    { type: 'livestock', name: 'chicken', id: 'chicken' },
    { type: 'livestock', name: 'guinea fowl', id: 'guinea-fowl' },
    { type: 'livestock', name: 'pigs', id: 'pigs' }
  ]
};
