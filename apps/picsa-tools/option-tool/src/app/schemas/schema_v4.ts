import { generateID } from '@picsa/shared/services/core/db/db.service';
import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { IOptionsToolEntry_v3, SCHEMA_V3 } from './schema_v3';

const SCHEMA_VERSION = 4;

const generateTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * ADD 'enterprise' and '_created_at' properties
 */
export interface IOptionsToolEntry_v4 extends IOptionsToolEntry_v3 {
  enterprise: string;
  _created_at: string;
}

export const SCHEMA_V4: RxJsonSchema<IOptionsToolEntry_v4> = {
  version: SCHEMA_VERSION,
  type: 'object',
  properties: {
    ...SCHEMA_V3.properties,
    enterprise: {
      type: 'string',
    },
    _created_at: {
      type: 'string',
    },
  },
  required: ['enterprise', '_created_at'],
  primaryKey: '_id',
};

export const COLLECTION_V4: IPicsaCollectionCreator<IOptionsToolEntry_v4> = {
  schema: SCHEMA_V4,
  isUserCollection: false,
  migrationStrategies: {
    4: (data: IOptionsToolEntry_v3): IOptionsToolEntry_v4 => ({
      ...data,
      enterprise: 'crop',
      _created_at: generateTimestamp(),
    }),
  },
};

// Use a function to generate templates to ensure new object instantiated with id
export function ENTRY_TEMPLATE_V4(): IOptionsToolEntry_v4 {
  return {
    _id: generateID(),
    practice: '',
    gender_decisions: [],
    gender_activities: [],
    benefits: [{ beneficiary: [], benefit: '' }],
    performance: { lowRf: '', highRf: '', midRf: '' },
    investment: { money: '', time: '' },
    time: { value: null, unit: 'month' },
    risk: [''],
    enterprise: 'crop',
    _created_at: generateTimestamp(),
  };
}
