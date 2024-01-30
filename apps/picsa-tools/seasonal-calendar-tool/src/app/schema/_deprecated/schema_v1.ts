import { generateID } from '@picsa/shared/services/core/db/db.service';
import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { CalendarDataEntry_v0, COLLECTION_V0, SCHEMA_V0  } from './schema_v0';

/**
 * ADD ID primary key
 * */
export interface CalendarDataEntry_v1 extends Omit<CalendarDataEntry_v0, 'unique_id'> {
  ID: string;
}


const { ...v1_properties_with_id } = SCHEMA_V0.properties;

export const SCHEMA_V1: RxJsonSchema<CalendarDataEntry_v1> = {
  ...SCHEMA_V0,
  version: 2,
  properties: {
    ...v1_properties_with_id,
        ID: {
            type: 'string'
        },
        name: {
          type: 'string',
          default: '',
        },
        timeAndConditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                  type: 'string'
              },
              weather: {
                  type: 'string'
              }
            }
          },
        },
        crops: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              extraInformation: {
                  type: 'string',
              },
              months: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                      activities: {
                          type: 'array',
                          items: {
                              type: 'string'
                          }
                      },
                      month:{
                          type: 'string'
                      }
                  }
                },
              },
            },
            required: ['name'],
          },
       },
     },
      required: ['name','ID'],
      primaryKey: 'ID',
}

export const COLLECTION_V1: IPicsaCollectionCreator<CalendarDataEntry_v1> = {
  ...COLLECTION_V0,
  schema: SCHEMA_V1,
  // Ensure old data can be migrated to new format
  // https://rxdb.info/data-migration.html
  migrationStrategies: {
    ...COLLECTION_V0.migrationStrategies,
    1: (data: CalendarDataEntry_v0): CalendarDataEntry_v1 => {
      const { ...data_with_id } = data;
      return {
        // rename 'gender' to 'gender_activities' and add 'gender_decisions'
        ...data_with_id,
        // add new id
        ID: generateID(),
      };
    },
  },
  // HACK - type def issue (not actually changed)
  conflictHandler: COLLECTION_V0.conflictHandler as any,
};
