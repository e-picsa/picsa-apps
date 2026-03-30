import { generateID } from '@picsa/shared/services/core/db/db.service';
import { generateTimestamp, type IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { COLLECTION_V4, IOptionsToolEntry_v4 } from './schema_v4';

const SCHEMA_VERSION = 5;

/**
 * Full schema v5 with all properties explicitly defined
 */
export interface IOptionsToolEntry_v5 {
  _id: string;
  practice: string;
  gender_decisions: string[];
  gender_activities: string[];
  benefits: { benefit: string; beneficiary: string[] }[];
  performance: {
    lowRf: string;
    midRf: string;
    highRf: string;
  };
  investment: {
    money: string;
    time: string;
  };
  time: { quantity: number | null; unit: 'month' | 'week' | 'day' };
  risk: string[];
  enterprise: 'crop' | 'livestock' | 'livelihood';
  _created_at: string;
}

export const SCHEMA_V5: RxJsonSchema<IOptionsToolEntry_v5> = {
  version: SCHEMA_VERSION,
  type: 'object',
  properties: {
    _id: { type: 'string' },
    practice: { type: 'string', default: '' },
    gender_decisions: {
      type: 'array',
      items: { type: 'string' },
    },
    gender_activities: {
      type: 'array',
      items: { type: 'string' },
    },
    benefits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          benefit: { type: 'string' },
          beneficiary: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['benefit', 'beneficiary'],
      },
    },
    performance: {
      type: 'object',
      properties: {
        lowRf: { type: 'string' },
        midRf: { type: 'string' },
        highRf: { type: 'string' },
      },
      required: ['lowRf', 'midRf', 'highRf'],
    },
    investment: {
      type: 'object',
      properties: {
        money: { type: 'string' },
        time: { type: 'string' },
      },
      required: ['money', 'time'],
    },
    time: {
      type: 'object',
      properties: {
        quantity: { type: ['integer', 'null'] },
        unit: { type: 'string' },
      },
    },
    risk: {
      type: 'array',
      items: { type: 'string' },
    },
    enterprise: {
      type: 'string',
      enum: ['crop', 'livestock', 'livelihood'],
    },
    _created_at: {
      type: 'string',
    },
  },
  required: ['_id', 'practice', 'enterprise', '_created_at'],
  primaryKey: '_id',
};

export const COLLECTION_V5: IPicsaCollectionCreator<IOptionsToolEntry_v5> = {
  schema: SCHEMA_V5,
  isUserCollection: false,
  migrationStrategies: {
    ...COLLECTION_V4.migrationStrategies,
    // Renamed time.value -> time.quantity for improved FormField compatibility ("value" reserved)
    5: (d: IOptionsToolEntry_v4): IOptionsToolEntry_v5 => {
      return {
        ...d,
        time: { quantity: d.time?.value || null, unit: d.time?.unit || null },
      };
    },
  },
};

// Use a function to generate templates to ensure new object instantiated with id
export function ENTRY_TEMPLATE_V5(): IOptionsToolEntry_v5 {
  return {
    _id: generateID(),
    practice: '',
    gender_decisions: [],
    gender_activities: [],
    benefits: [{ beneficiary: [], benefit: '' }],
    performance: { lowRf: '', highRf: '', midRf: '' },
    investment: { money: '', time: '' },
    time: { quantity: null, unit: 'month' },
    risk: [''],
    enterprise: 'crop',
    _created_at: generateTimestamp(),
  };
}
