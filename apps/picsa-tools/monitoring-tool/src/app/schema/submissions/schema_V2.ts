import { generateID } from '@picsa/shared/services/core/db/db.service';
import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { ISupabasePushEntry } from '@picsa/shared/services/core/db_v2/db-supabase-push.service';
import { RxJsonSchema } from 'rxdb';

import { IFormSubmission_V1, SCHEMA_V1 } from './schema_V1';

/**
 * DB forms include basic metadata on
 * */
export type IFormSubmission_V2 = IFormSubmission_V1 & ISupabasePushEntry;

export const SCHEMA_V2: RxJsonSchema<IFormSubmission_V2> = {
  ...SCHEMA_V1,
  properties: {
    ...SCHEMA_V1.properties,
    _supabase_push_status: { type: 'string' },
  },
  version: 2,
};

export const COLLECTION_V2: IPicsaCollectionCreator<IFormSubmission_V2> = {
  schema: SCHEMA_V2,
  isUserCollection: true,
  pushToSupabase: true,
  migrationStrategies: {
    2: (data: IFormSubmission_V1) => {
      const migrated: IFormSubmission_V2 = {
        ...data,
        _supabase_push_status: 'ready',
      };
      return migrated;
    },
  },
};

// Use a function to generate templates to ensure new object instantiated with id
export const ENTRY_TEMPLATE_V2 = (formId: string): IFormSubmission_V2 => ({
  _id: generateID(),
  _created: new Date().toISOString(),
  _modified: new Date().toISOString(),
  _supabase_push_status: 'ready',
  formId,
  json: {},
});
