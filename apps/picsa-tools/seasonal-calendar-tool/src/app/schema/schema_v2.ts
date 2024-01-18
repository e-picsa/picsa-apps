import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { CalendarDataEntry_v1, COLLECTION_V1, SCHEMA_V1 } from './schema_v1';

export interface CalendarDataEntry_v2 extends Omit<CalendarDataEntry_v1, 'crops'> {
  /** names of crops with list of activities to match months */
  crops: { name: string; activities: string[] }[];
}

export const SCHEMA_V2: RxJsonSchema<CalendarDataEntry_v2> = {
  ...SCHEMA_V1,
  version: 2,
  properties: {
    ...SCHEMA_V1.properties,
    crops: {
      type: 'array',
      items: {
        properties: {
          name: {
            type: 'string',
          },
          activities: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        required: ['name'],
      },
    },
  },
  required: ['name', 'ID'],
  primaryKey: 'ID',
};

export const COLLECTION_V2: IPicsaCollectionCreator<CalendarDataEntry_v2> = {
  ...COLLECTION_V1,
  schema: SCHEMA_V2,
  // Ensure old data can be migrated to new format
  // https://rxdb.info/data-migration.html
  migrationStrategies: {
    ...COLLECTION_V1.migrationStrategies,
    2: (data: CalendarDataEntry_v1): CalendarDataEntry_v2 => {
      const { crops, ...existing } = data;
      return {
        ...existing,
        // update crops to only include name and remove previous meta
        crops: crops.map((c) => ({
          name: c.name,
          activities: (c.months || []).map((c) => c.activities[0] || ''),
        })),
      };
    },
  },
  // HACK - type def issue (not actually changed)
  conflictHandler: COLLECTION_V1.conflictHandler as any,
};
