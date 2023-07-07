import { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { COLLECTION_V1, IOptionsToolEntry_v1, SCHEMA_V1 } from './schema_v1';

/** rename 'gender' to 'gender_activities' and add 'gender_decisions' */
export interface IOptionsToolEntry_v2 extends Omit<IOptionsToolEntry_v1, 'gender'> {
  gender_decisions: string[];
  gender_activities: string[];
}

export const ENTRY_TEMPLATE_V2: IOptionsToolEntry_v2 = {
  benefits: [],
  gender_decisions: [],
  gender_activities: [],
  investment: { money: '', time: '' },
  performance: { lowRf: '', highRf: '', midRf: '' },
  practice: '',
  risk: '',
  time: '',
  _app_user_id: '',
};

const { gender, ...v1_properties_without_gender } = SCHEMA_V1.properties;

export const SCHEMA_V2: RxJsonSchema<IOptionsToolEntry_v2> = {
  ...SCHEMA_V1,
  version: 2,
  properties: {
    ...v1_properties_without_gender,
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
  // HACK - type def issue (not actually changed)
  required: SCHEMA_V1.required as any,
  primaryKey: SCHEMA_V1.primaryKey as any,
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
      };
    },
  },
  // HACK - type def issue (not actually changed)
  conflictHandler: COLLECTION_V1.conflictHandler as any,
};
