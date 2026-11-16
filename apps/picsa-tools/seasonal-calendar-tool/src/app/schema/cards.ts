import { IPicsaCustomCard } from '@picsa/shared/features/cards';
import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

/** Custom crop or activity card, drawn and saved by a user */
export type ICalendarCard = IPicsaCustomCard;

export const SCHEMA: RxJsonSchema<ICalendarCard> = {
  title: 'seasonal_calendar_cards',
  version: 1,
  keyCompression: false,
  type: 'object',
  primaryKey: 'id',
  indexes: ['type'],
  required: ['id', 'type'],
  properties: {
    // RxDB requires string fields used as the primary key or in an index to declare a maxLength
    id: { type: 'string', maxLength: 100 },
    label: { type: 'string' },
    type: { type: 'string', maxLength: 20 },
    groupings: { type: 'array' },
    customMeta: { type: 'object' },
    imgType: { type: 'string' },
    imgId: { type: 'string' },
    _deleted: { type: 'boolean' },
  },
};

export const COLLECTION: IPicsaCollectionCreator<ICalendarCard> = {
  schema: SCHEMA,
  isUserCollection: true,
  // v0 -> v1: added `maxLength` to indexed string fields, no change to document data itself
  migrationStrategies: {
    1: async (oldDoc) => oldDoc,
  },
};
