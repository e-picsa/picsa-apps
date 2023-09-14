import { generateID } from '@picsa/shared/services/core/db/db.service';
import { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { COLLECTION_V2, IOptionsToolEntry_v2, SCHEMA_V2 } from './schema_v2';

const SCHEMA_VERSION = 3;

/**
 * UPDATE 'risk' to take array of values
 * UPDATE 'time' to take both value and unit properties
 * */
export interface IOptionsToolEntry_v3 extends Omit<Omit<IOptionsToolEntry_v2, 'risk'>, 'time'> {
  risk: string[];
  time: { unit: 'month' | 'week' | 'day'; value: number | null };
  _id: string;
}

// Use a function to generate templates to ensure new object instantiated with id
export const ENTRY_TEMPLATE_V3: () => IOptionsToolEntry_v3 = () => ({
  _id: generateID(),
  practice: '',
  gender_decisions: [],
  gender_activities: [],
  benefits: [{ beneficiary: [], benefit: '' }],
  performance: { lowRf: '', highRf: '', midRf: '' },
  investment: { money: '', time: '' },
  time: { value: null, unit: 'month' },
  risk: [''],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { risk, time, ...unchanged_properties } = SCHEMA_V2.properties;

export const SCHEMA_V3: RxJsonSchema<IOptionsToolEntry_v3> = {
  ...SCHEMA_V2,
  version: SCHEMA_VERSION,
  properties: {
    ...unchanged_properties,
    risk: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    time: {
      type: 'object',
      properties: {
        value: {
          type: 'integer',
        },
        unit: {
          type: 'string',
        },
      },
    },
  },
  primaryKey: '_id',
};

export const COLLECTION_V3: IPicsaCollectionCreator<IOptionsToolEntry_v3> = {
  ...COLLECTION_V2,
  schema: SCHEMA_V3,
  // Ensure old data can be migrated to new format
  // https://rxdb.info/data-migration.html
  migrationStrategies: {
    ...COLLECTION_V2.migrationStrategies,
    3: (data: IOptionsToolEntry_v2): IOptionsToolEntry_v3 => {
      return {
        ...data,
        time: {
          unit: 'month',
          value: parseInt(data.time) || 0,
        },
        risk: [data.risk],
        _id: generateID(),
      };
    },
  },
  // HACK - type def issue (not actually changed)
  conflictHandler: COLLECTION_V2.conflictHandler as any,
};
