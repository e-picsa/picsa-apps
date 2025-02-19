import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { IBudgetCardType } from './common';
import { COLLECTION_V1, ENTRY_TEMPLATE_V1, IBudgetCard_v1, SCHEMA_V1 } from './schema_v1';

export type IBudgetCard_V2 = IBudgetCard_v1;

// add 'type' to required field as it is used in index
export const SCHEMA_V2: RxJsonSchema<IBudgetCard_V2> = {
  ...SCHEMA_V1,
  version: 2,
  required: ['type', 'id'],
};

export const COLLECTION_V2: IPicsaCollectionCreator<IBudgetCard_v1> = {
  ...COLLECTION_V1,
  schema: SCHEMA_V2,
  migrationStrategies: {
    ...COLLECTION_V1.migrationStrategies,
    2: async (data: IBudgetCard_v1): Promise<IBudgetCard_V2> => data,
  },
};

/** Entry template used for user-generated budget cards */
export const ENTRY_TEMPLATE_V2 = (options: {
  type: IBudgetCardType;
  groupings: IBudgetCard_v1['groupings'];
  label: string;
  imgData: string;
}): IBudgetCard_V2 => ENTRY_TEMPLATE_V1(options);
