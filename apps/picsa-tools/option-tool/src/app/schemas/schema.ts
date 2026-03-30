import { generateID } from '@picsa/shared/services/core/db/db.service';
import { generateTimestamp, type IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import migrationStrategies from './migration-strategies';
import { IOptionsToolEntry_v5 } from './types';

/**
 * @Note
 * If planning a migration do the following:
 *
 * 1. Create an interface in './types' to describe minimal type changes
 * 2. Update type imports above to use latest version
 * 3. Update `IOptionsToolEntry` and `_typeCheck` to satisfy type changes
 * 4. Update ENTRY_TEMPLATE
 * 5. Update SCHEMA_VERSION below LAST!! (avoid rxdb invalid state)
 *
 * On next startup app will run and apply data migrations
 */
const SCHEMA_VERSION = 5;

// Step 3a
export interface IOptionsToolEntry {
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

type ExactEqual<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

// Step 3b
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeCheck: ExactEqual<IOptionsToolEntry, IOptionsToolEntry_v5> = true;

// Step 4
export const SCHEMA: RxJsonSchema<IOptionsToolEntry> = {
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

// Use a function to generate templates to ensure new object instantiated with id
export function ENTRY_TEMPLATE(): IOptionsToolEntry {
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

export const COLLECTION: IPicsaCollectionCreator<IOptionsToolEntry> = {
  schema: SCHEMA,
  isUserCollection: false,
  migrationStrategies,
};
