import { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

interface Benefit {
  benefit: string;
  beneficiary: string[];
}

export interface IOptionsToolEntry_v0 {
  practice: string;
  gender: string[];
  benefits: Benefit[];
  performance: {
    lowRf: string;
    midRf: string;
    highRf: string;
  };
  investment: {
    money: string;
    time: string;
  };
  time: string;
  risk: string;
}

export const SCHEMA_V0: RxJsonSchema<IOptionsToolEntry_v0> = {
  title: 'practice entry schema',
  version: 0,
  keyCompression: false,
  type: 'object',
  properties: {
    practice: {
      type: 'string',
      default: '',
    },
    gender: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    benefits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          benefit: {
            type: 'string',
          },
          beneficiary: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        required: ['benefit', 'beneficiary'],
      },
    },
    performance: {
      type: 'object',
      properties: {
        lowRf: {
          type: 'string',
        },
        midRf: {
          type: 'string',
        },
        highRf: {
          type: 'string',
        },
      },
      required: ['lowRf', 'midRf', 'highRf'],
    },
    investment: {
      type: 'object',
      properties: {
        money: {
          type: 'string',
        },
        time: {
          type: 'string',
        },
      },
      required: ['money', 'time'],
    },
    time: {
      type: 'string',
    },
    risk: {
      type: 'string',
    },
  },
  required: ['practice'],
  primaryKey: 'practice',
};

export const COLLECTION_V0: IPicsaCollectionCreator<IOptionsToolEntry_v0> = {
  schema: SCHEMA_V0,
  isUserCollection: false,
};
