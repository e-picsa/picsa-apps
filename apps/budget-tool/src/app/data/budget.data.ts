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
    {
      type: 'crop',
      name: 'maize',
      id: 'maize',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'crop',
      name: 'rice',
      id: 'rice',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'crop',
      name: 'beans',
      id: 'beans',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'crop',
      name: 'soya beans',
      id: 'soya-beans',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'crop',
      name: 'groundnuts',
      id: 'groundnuts',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'crop',
      name: 'pigeon peas',
      id: 'pigeon-peas',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'crop',
      name: 'cowpeas',
      id: 'cowpeas',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'crop',
      name: 'sweet potatoes',
      id: 'sweet-potatoes',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'crop',
      name: 'sorghum',
      id: 'sorghum',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'fish',
      name: 'fish',
      id: 'fish',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'fruits',
      name: 'avocado',
      id: 'avocado',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'fruits',
      name: 'mangoes',
      id: 'mangoes',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'fruits',
      name: 'paw-paw',
      id: 'paw-paw',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'fruits',
      name: 'watermelon',
      id: 'watermelon',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'fruits',
      name: 'mixed',
      id: 'mixed',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'fruits',
      name: 'pumpkins',
      id: 'pumpkins',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'livestock',
      name: 'cattle',
      id: 'cattle',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'livestock',
      name: 'goats',
      id: 'goats',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'livestock',
      name: 'sheep',
      id: 'sheep',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'livestock',
      name: 'ducks',
      id: 'ducks',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'livestock',
      name: 'chicken',
      id: 'chicken',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'livestock',
      name: 'guinea fowl',
      id: 'guinea-fowl',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    },
    {
      type: 'livestock',
      name: 'pigs',
      id: 'pigs',
      defaults: {
        scale: 'months',
        starting: 10,
        total: 6
      }
    }
  ]
};
