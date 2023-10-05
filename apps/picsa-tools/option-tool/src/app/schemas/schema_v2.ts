import { generateID } from '@picsa/shared/services/core/db/db.service';
import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { COLLECTION_V1, IOptionsToolEntry_v1, SCHEMA_V1 } from './schema_v1';

/**
 * RENAME 'gender' to 'gender_activities'
 * ADD 'gender_decisions'
 * ADD _id primary key
 * */
export interface IOptionsToolEntry_v2 extends Omit<IOptionsToolEntry_v1, 'gender'> {
  gender_decisions: string[];
  gender_activities: string[];
  _id: string;
}

// Use a function to generate templates to ensure new object instantiated with id
export const ENTRY_TEMPLATE_V2: () => IOptionsToolEntry_v2 = () => ({
  _id: generateID(),
  practice: '',
  gender_decisions: [],
  gender_activities: [],
  benefits: [],
  performance: { lowRf: '', highRf: '', midRf: '' },
  investment: { money: '', time: '' },
  time: '',
  risk: '',
});

const { gender, ...v1_properties_without_gender } = SCHEMA_V1.properties;

export const SCHEMA_V2: RxJsonSchema<IOptionsToolEntry_v2> = {
  ...SCHEMA_V1,
  version: 2,
  properties: {
    ...v1_properties_without_gender,
    _id: {
      type: 'string',
    },
    gender_activities: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    gender_decisions: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: ['_id', 'practice'],
  primaryKey: '_id',
};

export const COLLECTION_V2: IPicsaCollectionCreator<IOptionsToolEntry_v2> = {
  ...COLLECTION_V1,
  schema: SCHEMA_V2,
  // Ensure old data can be migrated to new format
  // https://rxdb.info/data-migration.html
  migrationStrategies: {
    ...COLLECTION_V1.migrationStrategies,
    2: (data: IOptionsToolEntry_v1): IOptionsToolEntry_v2 => {
      const { gender, ...data_without_gender } = data;
      return {
        // rename 'gender' to 'gender_activities' and add 'gender_decisions'
        ...data_without_gender,
        gender_activities: gender,
        gender_decisions: [],
        // add new id
        _id: generateID(),
      };
    },
  },
  // HACK - type def issue (not actually changed)
  conflictHandler: COLLECTION_V1.conflictHandler as any,
};
