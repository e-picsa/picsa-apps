import { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

export interface CalendarDataEntry_v0 {
  name: string;
  timeAndConditions: {
    month: string;
    weather: string;
  }[];
  crops: {
    name: string;
    months: {
      month: string;
      activities: string[];
    }[];
    extraInformation: string;
  }[];
}

export const SCHEMA_V0: RxJsonSchema<CalendarDataEntry_v0> = {
  title: 'calender entry schema',
  version: 0,
  keyCompression: false,
  type: 'object',
  properties: {
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
            type: 'string',
          },
          weather: {
            type: 'string',
          },
        },
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
                    type: 'string',
                  },
                },
                month: {
                  type: 'string',
                },
              },
            },
          },
        },
        required: ['name'],
      },
    },
  },
  required: ['name'],
  primaryKey: 'name',
};

export const COLLECTION_V0: IPicsaCollectionCreator<CalendarDataEntry_v0> = {
  schema: SCHEMA_V0,
  isUserCollection: false,
};
