import { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { IOptionsToolEntry_v0, SCHEMA_V0 } from './schema_v0';

export type IOptionsToolEntry_v1 = IOptionsToolEntry_v0;

export const SCHEMA_V1: RxJsonSchema<IOptionsToolEntry_v1> = {
  ...SCHEMA_V0,
  version: 1,
};

/**
 * Converts to user collection, adding `_app_user_id` property
 */
export const COLLECTION_V1: IPicsaCollectionCreator<IOptionsToolEntry_v1> = {
  schema: SCHEMA_V1,
  isUserCollection: true,
  // Ensure old data can be migrated to new format
  // https://rxdb.info/data-migration.html
  migrationStrategies: {
    1: (data: IOptionsToolEntry_v0): IOptionsToolEntry_v1 => ({
      ...data,
    }),
  },
};
