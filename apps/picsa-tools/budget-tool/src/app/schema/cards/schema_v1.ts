import { generateID } from '@picsa/shared/services/core/db/db.service';
import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { IBudgetCardCustomMeta, IBudgetCardGrouping, IBudgetCardType, IBudgetCardValues } from './common';

// Initial migration simply the same as legacy version
// cards are used for budget table population as well as enterprise

export type IBudgetCard_v1 = {
  // id used as well as key to easier specify image (and be non-unique for things like inputs and outputs)
  id: string;
  label: string;
  type: IBudgetCardType;
  groupings?: IBudgetCardGrouping[];
  customMeta?: IBudgetCardCustomMeta;
  values?: IBudgetCardValues;
  imgType?: 'svg' | 'png';
  /** Optional image overide (default used card id) */
  imgId?: string;
  _deleted?: boolean;
};

export const SCHEMA_V1: RxJsonSchema<IBudgetCard_v1> = {
  version: 1,
  keyCompression: false,
  type: 'object',
  required: ['id'],
  primaryKey: 'id',
  indexes: ['type'],
  properties: {
    _deleted: { type: 'boolean' },
    customMeta: { type: 'object' },
    id: { type: 'string' },
    groupings: { type: 'array' },
    imgId: { type: 'string' },
    imgType: { type: 'string' },
    label: { type: 'string' },
    type: { type: 'string' },
    values: { type: 'object' },
  },
};

export const COLLECTION_V1: IPicsaCollectionCreator<IBudgetCard_v1> = {
  schema: SCHEMA_V1,
  isUserCollection: true,
  migrationStrategies: {
    1: async (data) => {
      console.log('migrate old data', data);
    },
  },
};

/** Entry template used for user-generated budget cards */
export const ENTRY_TEMPLATE_V1 = (options: {
  type: IBudgetCardType;
  groupings: IBudgetCard_v1['groupings'];
  label: string;
  imgData: string;
}): IBudgetCard_v1 => {
  const { groupings, label, type, imgData } = options;
  return {
    id: generateID(),
    customMeta: { imgData, createdBy: '', dateCreated: new Date().toISOString() },
    groupings,
    label,
    type,
  };
};
